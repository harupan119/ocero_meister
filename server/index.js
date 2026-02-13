const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const RoomManager = require('./roomManager');
const { analyzeMoves } = require('./meisterAnalysis');
const { router: adminRouter, loadHistory, HISTORY_PATH, GUEST_NAME } = require('./routes/admin');
const { BLACK, WHITE } = require('./gameLogic');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRouter);

// Serve client build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

const roomManager = new RoomManager();
const onlineUsers = {}; // socketId -> userName
const userSockets = {}; // userName -> socketId

function broadcastRoomList() {
  io.emit('lobby:roomList', roomManager.getRoomList());
}

function broadcastRoomState(roomId) {
  const state = roomManager.getRoomState(roomId);
  io.to(`room:${roomId}`).emit('room:state', state);
  broadcastRoomList();
}

// Timer ticks
setInterval(() => {
  for (let i = 1; i <= 4; i++) {
    const room = roomManager.rooms[i];
    if (room.game && room.game.status === 'playing' && room.game.timers) {
      const result = roomManager.tickTimer(i);
      if (result && result.timeout) {
        broadcastRoomState(i);
      } else if (result) {
        io.to(`room:${i}`).emit('game:timer', result);
      }
    }
  }
}, 1000);

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.emit('lobby:roomList', roomManager.getRoomList());

  socket.on('lobby:getRooms', () => {
    socket.emit('lobby:roomList', roomManager.getRoomList());
  });

  socket.on('user:login', (userName, callback) => {
    // Check if user is reconnecting
    const reconnectRoom = roomManager.handleReconnect(userName);

    // Check if another socket is using this name
    if (userSockets[userName] && userSockets[userName] !== socket.id) {
      const oldSocket = io.sockets.sockets.get(userSockets[userName]);
      if (oldSocket) {
        oldSocket.emit('user:kicked');
        oldSocket.disconnect(true);
      }
    }

    onlineUsers[socket.id] = userName;
    userSockets[userName] = socket.id;

    if (callback) {
      callback({ success: true, reconnectRoom });
    }

    io.emit('lobby:onlineUsers', Object.values(onlineUsers));
  });

  socket.on('room:join', ({ roomId, role }, callback) => {
    const userName = onlineUsers[socket.id];
    if (!userName) return callback?.({ error: 'Not logged in' });

    const result = roomManager.joinRoom(roomId, userName, role);
    if (result.error) return callback?.({ error: result.error });

    socket.join(`room:${roomId}`);
    socket.roomId = roomId;
    broadcastRoomState(roomId);
    callback?.(result);
  });

  socket.on('room:leave', (callback) => {
    const userName = onlineUsers[socket.id];
    const roomId = socket.roomId;
    if (!userName || !roomId) return callback?.({ error: 'Not in a room' });

    roomManager.leaveRoom(roomId, userName);
    socket.leave(`room:${roomId}`);
    socket.roomId = null;
    broadcastRoomState(roomId);
    callback?.({ success: true });
  });

  socket.on('room:swap', (callback) => {
    const roomId = socket.roomId;
    if (!roomId) return callback?.({ error: 'Not in a room' });

    const success = roomManager.swapSides(roomId);
    if (!success) return callback?.({ error: 'Cannot swap during game' });

    broadcastRoomState(roomId);
    callback?.({ success: true });
  });

  socket.on('room:settings', ({ timeLimit }, callback) => {
    const roomId = socket.roomId;
    if (!roomId) return callback?.({ error: 'Not in a room' });

    roomManager.updateSettings(roomId, { timeLimit });
    broadcastRoomState(roomId);
    callback?.({ success: true });
  });

  socket.on('game:start', (callback) => {
    const roomId = socket.roomId;
    if (!roomId) return callback?.({ error: 'Not in a room' });

    const result = roomManager.startGame(roomId);
    if (result.error) return callback?.({ error: result.error });

    broadcastRoomState(roomId);
    callback?.({ success: true });
  });

  socket.on('game:move', ({ row, col }, callback) => {
    const userName = onlineUsers[socket.id];
    const roomId = socket.roomId;
    if (!userName || !roomId) return callback?.({ error: 'Not in a room' });

    const result = roomManager.makeMove(roomId, userName, row, col);
    if (result.error) return callback?.({ error: result.error });

    broadcastRoomState(roomId);

    // Save to history if game ended
    const room = roomManager.rooms[roomId];
    if (room.game && room.game.status === 'finished') {
      saveGameHistory(room.game.result);
    }

    callback?.({ success: true, flipped: result.flipped });
  });

  socket.on('meister:analyze', ({ board, color }, callback) => {
    try {
      const result = analyzeMoves(board, color);
      callback?.(result);
    } catch (err) {
      console.error('Meister analysis error:', err);
      callback?.({ error: 'Analysis failed' });
    }
  });

  socket.on('disconnect', () => {
    const userName = onlineUsers[socket.id];
    const roomId = socket.roomId;
    console.log(`Disconnected: ${socket.id} (${userName})`);

    if (userName) {
      delete onlineUsers[socket.id];
      if (userSockets[userName] === socket.id) {
        delete userSockets[userName];
      }

      if (roomId) {
        const room = roomManager.rooms[roomId];
        if (room && room.game && room.game.status === 'playing') {
          // Check if this user is a player in the active game
          const isPlayer = room.game.blackPlayer === userName || room.game.whitePlayer === userName;
          if (isPlayer) {
            roomManager.handleDisconnect(userName, roomId);
            io.to(`room:${roomId}`).emit('game:playerDisconnected', { userName });
          } else {
            roomManager.leaveRoom(roomId, userName);
          }
        } else {
          roomManager.leaveRoom(roomId, userName);
        }
        broadcastRoomState(roomId);
      }

      io.emit('lobby:onlineUsers', Object.values(onlineUsers));
    }
  });
});

function saveGameHistory(result) {
  if (!result) return;
  if (result.blackPlayer === GUEST_NAME || result.whitePlayer === GUEST_NAME) return;
  try {
    const history = loadHistory();
    history.push({
      ...result,
      timestamp: Date.now(),
    });
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Failed to save history:', err);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Othello Meister server running on port ${PORT}`);
});
