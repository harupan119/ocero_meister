const {
  BLACK, WHITE,
  createInitialBoard, getValidMoves, applyMove, countPieces, isGameOver, getWinner, opponent,
} = require('./gameLogic');

const NUM_ROOMS = 4;

function createRoom(id) {
  return {
    id,
    players: { [BLACK]: null, [WHITE]: null },
    spectators: [],
    game: null,
    settings: { timeLimit: 0 }, // 0 = no time limit, otherwise seconds
  };
}

function createGame(blackPlayer, whitePlayer, timeLimit) {
  const board = createInitialBoard();
  return {
    board,
    currentTurn: BLACK,
    blackPlayer,
    whitePlayer,
    startedAt: Date.now(),
    moveHistory: [],
    passCount: 0,
    timeLimit,
    timers: timeLimit > 0 ? {
      [BLACK]: timeLimit * 1000,
      [WHITE]: timeLimit * 1000,
      lastTick: Date.now(),
    } : null,
    status: 'playing', // 'playing' | 'finished'
    result: null,
  };
}

class RoomManager {
  constructor() {
    this.rooms = {};
    for (let i = 1; i <= NUM_ROOMS; i++) {
      this.rooms[i] = createRoom(i);
    }
    this.userSockets = {}; // userName -> { socketId, roomId, role }
    this.disconnectTimers = {}; // userName -> timeout
  }

  getRoomList() {
    return Object.values(this.rooms).map(room => ({
      id: room.id,
      players: {
        [BLACK]: room.players[BLACK],
        [WHITE]: room.players[WHITE],
      },
      spectatorCount: room.spectators.length,
      hasGame: !!room.game,
      gameStatus: room.game?.status || null,
      settings: room.settings,
    }));
  }

  getRoomState(roomId) {
    const room = this.rooms[roomId];
    if (!room) return null;
    return {
      id: room.id,
      players: room.players,
      spectators: room.spectators,
      settings: room.settings,
      game: room.game ? {
        board: room.game.board,
        currentTurn: room.game.currentTurn,
        blackPlayer: room.game.blackPlayer,
        whitePlayer: room.game.whitePlayer,
        moveHistory: room.game.moveHistory,
        validMoves: getValidMoves(room.game.board, room.game.currentTurn),
        pieces: countPieces(room.game.board),
        status: room.game.status,
        result: room.game.result,
        timers: room.game.timers ? {
          [BLACK]: room.game.timers[BLACK],
          [WHITE]: room.game.timers[WHITE],
        } : null,
      } : null,
    };
  }

  joinRoom(roomId, userName, role) {
    const room = this.rooms[roomId];
    if (!room) return { error: 'Room not found' };

    if (role === 'spectator') {
      if (!room.spectators.includes(userName)) {
        room.spectators.push(userName);
      }
      return { success: true, role: 'spectator' };
    }

    // Already a player — return existing role (handles refresh/reconnect)
    if (room.players[BLACK] === userName) {
      room.spectators = room.spectators.filter(s => s !== userName);
      return { success: true, role: 'black' };
    }
    if (room.players[WHITE] === userName) {
      room.spectators = room.spectators.filter(s => s !== userName);
      return { success: true, role: 'white' };
    }

    // Try to join as player
    if (room.game && room.game.status === 'playing') {
      // Game in progress, can only spectate
      if (!room.spectators.includes(userName)) {
        room.spectators.push(userName);
      }
      return { success: true, role: 'spectator' };
    }

    // Clear finished game so new players get a fresh room
    if (room.game && room.game.status === 'finished') {
      room.game = null;
    }

    if (!room.players[BLACK]) {
      room.players[BLACK] = userName;
      return { success: true, role: 'black' };
    }
    if (!room.players[WHITE]) {
      room.players[WHITE] = userName;
      return { success: true, role: 'white' };
    }

    // Both seats taken, join as spectator
    if (!room.spectators.includes(userName)) {
      room.spectators.push(userName);
    }
    return { success: true, role: 'spectator' };
  }

  leaveRoom(roomId, userName) {
    const room = this.rooms[roomId];
    if (!room) return;

    if (room.players[BLACK] === userName) {
      room.players[BLACK] = null;
      if (room.game && room.game.status === 'playing') {
        this._endGame(room, 'forfeit', WHITE);
      }
    }
    if (room.players[WHITE] === userName) {
      room.players[WHITE] = null;
      if (room.game && room.game.status === 'playing') {
        this._endGame(room, 'forfeit', BLACK);
      }
    }
    room.spectators = room.spectators.filter(s => s !== userName);
  }

  swapSides(roomId) {
    const room = this.rooms[roomId];
    if (!room || (room.game && room.game.status === 'playing')) return false;
    const temp = room.players[BLACK];
    room.players[BLACK] = room.players[WHITE];
    room.players[WHITE] = temp;
    room.game = null;
    return true;
  }

  updateSettings(roomId, settings) {
    const room = this.rooms[roomId];
    if (!room) return false;
    if (settings.timeLimit !== undefined) {
      room.settings.timeLimit = settings.timeLimit;
    }
    return true;
  }

  startGame(roomId) {
    const room = this.rooms[roomId];
    if (!room) return { error: 'Room not found' };
    if (!room.players[BLACK] || !room.players[WHITE]) {
      return { error: 'Need two players' };
    }
    if (room.game && room.game.status === 'playing') {
      return { error: 'Game already in progress' };
    }

    // Clear previous finished game
    room.game = createGame(room.players[BLACK], room.players[WHITE], room.settings.timeLimit);
    return { success: true };
  }

  makeMove(roomId, userName, row, col) {
    const room = this.rooms[roomId];
    if (!room || !room.game || room.game.status !== 'playing') {
      return { error: 'No active game' };
    }

    const game = room.game;
    const playerColor = game.blackPlayer === userName ? BLACK :
                        game.whitePlayer === userName ? WHITE : null;

    if (!playerColor || playerColor !== game.currentTurn) {
      return { error: 'Not your turn' };
    }

    const result = applyMove(game.board, playerColor, row, col);
    if (!result) {
      return { error: 'Invalid move' };
    }

    // Update timer
    if (game.timers) {
      const now = Date.now();
      const elapsed = now - game.timers.lastTick;
      game.timers[playerColor] -= elapsed;
      game.timers.lastTick = now;
    }

    game.board = result.board;
    game.moveHistory.push({ color: playerColor, row, col, flipped: result.flipped });
    game.passCount = 0;

    // Check game over
    if (isGameOver(game.board)) {
      const winner = getWinner(game.board);
      const pieces = countPieces(game.board);
      this._endGame(room, 'complete', winner, pieces);
      return { success: true, flipped: result.flipped, gameOver: true };
    }

    // Switch turn
    const nextColor = opponent(playerColor);
    const nextMoves = getValidMoves(game.board, nextColor);

    if (nextMoves.length === 0) {
      // Next player must pass
      game.currentTurn = playerColor; // Stay with current player
      game.passCount++;
      return { success: true, flipped: result.flipped, passed: nextColor };
    }

    game.currentTurn = nextColor;
    if (game.timers) {
      game.timers.lastTick = Date.now();
    }
    return { success: true, flipped: result.flipped };
  }

  tickTimer(roomId) {
    const room = this.rooms[roomId];
    if (!room || !room.game || room.game.status !== 'playing' || !room.game.timers) {
      return null;
    }

    const game = room.game;
    const now = Date.now();
    const elapsed = now - game.timers.lastTick;
    game.timers[game.currentTurn] -= elapsed;
    game.timers.lastTick = now;

    if (game.timers[game.currentTurn] <= 0) {
      game.timers[game.currentTurn] = 0;
      const winner = opponent(game.currentTurn);
      this._endGame(room, 'timeout', winner);
      return { timeout: true, loser: game.currentTurn };
    }

    return {
      [BLACK]: Math.max(0, game.timers[BLACK]),
      [WHITE]: Math.max(0, game.timers[WHITE]),
    };
  }

  handleDisconnect(userName, roomId) {
    // Start 30-second timer for reconnection
    this.disconnectTimers[userName] = {
      roomId,
      timer: setTimeout(() => {
        // Forfeit after 30 seconds
        this.leaveRoom(roomId, userName);
        delete this.disconnectTimers[userName];
      }, 30000),
      disconnectedAt: Date.now(),
    };
  }

  handleReconnect(userName) {
    const info = this.disconnectTimers[userName];
    if (info) {
      clearTimeout(info.timer);
      delete this.disconnectTimers[userName];
      return info.roomId;
    }
    return null;
  }

  _endGame(room, reason, winner, pieces) {
    if (!room.game) return;
    room.game.status = 'finished';
    if (!pieces) pieces = countPieces(room.game.board);
    room.game.result = {
      reason, // 'complete' | 'forfeit' | 'timeout'
      winner, // BLACK | WHITE | null (draw)
      winnerName: winner === BLACK ? room.game.blackPlayer :
                  winner === WHITE ? room.game.whitePlayer : null,
      loserName: winner === BLACK ? room.game.whitePlayer :
                 winner === WHITE ? room.game.blackPlayer : null,
      pieces,
      blackPlayer: room.game.blackPlayer,
      whitePlayer: room.game.whitePlayer,
    };
  }
}

module.exports = RoomManager;
