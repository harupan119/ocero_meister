import { io } from 'socket.io-client';

const URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

const socket = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 30,
});

export default socket;
