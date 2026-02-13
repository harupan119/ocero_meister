import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

const BLACK = 1;
const WHITE = 2;

export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    function handleRoomList(data) {
      setRooms(data);
    }

    function requestRooms() {
      socket.emit('lobby:getRooms');
    }

    socket.on('lobby:roomList', handleRoomList);
    socket.on('connect', requestRooms);

    // Request immediately if already connected
    if (socket.connected) {
      requestRooms();
    }

    return () => {
      socket.off('lobby:roomList', handleRoomList);
      socket.off('connect', requestRooms);
    };
  }, []);

  function getStatusText(room) {
    if (room.hasGame && room.gameStatus === 'playing') return '対戦中';
    if (room.players[BLACK] && room.players[WHITE]) return '準備完了';
    if (room.players[BLACK] || room.players[WHITE]) return '待機中';
    return '空室';
  }

  function getStatusClass(room) {
    if (room.hasGame && room.gameStatus === 'playing') return 'status-playing';
    if (room.players[BLACK] && room.players[WHITE]) return 'status-ready';
    if (room.players[BLACK] || room.players[WHITE]) return 'status-waiting';
    return 'status-empty';
  }

  return (
    <div className="room-list">
      {rooms.map(room => (
        <div
          key={room.id}
          className={`room-card ${getStatusClass(room)}`}
          onClick={() => navigate(`/room/${room.id}`)}
        >
          <div className="room-card-header">
            <h3>Room {room.id}</h3>
            <span className="room-status">{getStatusText(room)}</span>
          </div>
          <div className="room-players">
            <div className="player-slot black-slot">
              <span className="stone black-stone">●</span>
              <span>{room.players[BLACK] || '---'}</span>
            </div>
            <span className="vs">vs</span>
            <div className="player-slot white-slot">
              <span className="stone white-stone">○</span>
              <span>{room.players[WHITE] || '---'}</span>
            </div>
          </div>
          {room.spectatorCount > 0 && (
            <div className="room-spectators">観戦: {room.spectatorCount}人</div>
          )}
          {room.settings.timeLimit > 0 && (
            <div className="room-time">持ち時間: {room.settings.timeLimit}秒</div>
          )}
        </div>
      ))}
    </div>
  );
}
