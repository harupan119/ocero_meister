import { useEffect } from 'react';
import socket from '../socket';

export function useSocketEvent(event, handler) {
  useEffect(() => {
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [event, handler]);
}

export function useSocketEmit() {
  return (event, data, callback) => {
    socket.emit(event, data, callback);
  };
}
