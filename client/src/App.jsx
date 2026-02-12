import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import socket from './socket';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import AdminPage from './pages/AdminPage';

export const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export default function App() {
  const [userName, setUserName] = useState(
    () => sessionStorage.getItem('othello_user') || ''
  );
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('user:kicked', () => {
      setUserName('');
      sessionStorage.removeItem('othello_user');
    });

    socket.connect();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('user:kicked');
    };
  }, []);

  useEffect(() => {
    if (connected && userName) {
      socket.emit('user:login', userName, (res) => {
        if (res.reconnectRoom) {
          // Will be handled by the room page
        }
      });
    }
  }, [connected, userName]);

  function login(name) {
    setUserName(name);
    sessionStorage.setItem('othello_user', name);
    socket.emit('user:login', name);
  }

  function logout() {
    setUserName('');
    sessionStorage.removeItem('othello_user');
  }

  return (
    <AppContext.Provider value={{ userName, login, logout, socket, connected }}>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/room/:roomId" element={
              userName ? <RoomPage /> : <Navigate to="/" />
            } />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
