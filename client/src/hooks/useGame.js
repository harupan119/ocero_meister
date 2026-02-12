import { useState, useEffect, useCallback } from 'react';
import socket from '../socket';

const BLACK = 1;
const WHITE = 2;

export default function useGame(roomId) {
  const [roomState, setRoomState] = useState(null);
  const [lastFlipped, setLastFlipped] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [timers, setTimers] = useState(null);
  const [disconnectedPlayer, setDisconnectedPlayer] = useState(null);

  useEffect(() => {
    function handleRoomState(state) {
      setRoomState(state);
      if (state?.game?.timers) {
        setTimers(state.game.timers);
      }
    }

    function handleTimer(t) {
      setTimers(t);
    }

    function handlePlayerDisconnected({ userName }) {
      setDisconnectedPlayer(userName);
    }

    socket.on('room:state', handleRoomState);
    socket.on('game:timer', handleTimer);
    socket.on('game:playerDisconnected', handlePlayerDisconnected);

    return () => {
      socket.off('room:state', handleRoomState);
      socket.off('game:timer', handleTimer);
      socket.off('game:playerDisconnected', handlePlayerDisconnected);
    };
  }, [roomId]);

  const joinRoom = useCallback((role = 'player') => {
    return new Promise((resolve) => {
      socket.emit('room:join', { roomId: Number(roomId), role }, (res) => {
        resolve(res);
      });
    });
  }, [roomId]);

  const leaveRoom = useCallback(() => {
    return new Promise((resolve) => {
      socket.emit('room:leave', (res) => {
        resolve(res);
      });
    });
  }, []);

  const swapSides = useCallback(() => {
    return new Promise((resolve) => {
      socket.emit('room:swap', (res) => {
        resolve(res);
      });
    });
  }, []);

  const updateSettings = useCallback((settings) => {
    return new Promise((resolve) => {
      socket.emit('room:settings', settings, (res) => {
        resolve(res);
      });
    });
  }, []);

  const startGame = useCallback(() => {
    return new Promise((resolve) => {
      socket.emit('game:start', (res) => {
        resolve(res);
      });
    });
  }, []);

  const makeMove = useCallback((row, col) => {
    return new Promise((resolve) => {
      socket.emit('game:move', { row, col }, (res) => {
        if (res.success && res.flipped) {
          setLastFlipped(res.flipped);
          setLastMove({ row, col });
          setTimeout(() => {
            setLastFlipped([]);
            setLastMove(null);
          }, 600);
        }
        resolve(res);
      });
    });
  }, []);

  const requestAnalysis = useCallback((board, color) => {
    return new Promise((resolve) => {
      socket.emit('meister:analyze', { board, color }, (res) => {
        resolve(res);
      });
    });
  }, []);

  return {
    roomState,
    lastFlipped,
    lastMove,
    timers,
    disconnectedPlayer,
    joinRoom,
    leaveRoom,
    swapSides,
    updateSettings,
    startGame,
    makeMove,
    requestAnalysis,
  };
}

export { BLACK, WHITE };
