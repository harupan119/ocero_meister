import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import UserSelect from '../components/UserSelect';
import RoomList from '../components/RoomList';
import StatsView from '../components/StatsView';

export default function LobbyPage() {
  const { userName, logout } = useAppContext();
  const [showStats, setShowStats] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [adminClickTimer, setAdminClickTimer] = useState(null);
  const navigate = useNavigate();

  function handleAdminTrigger() {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);

    if (adminClickTimer) clearTimeout(adminClickTimer);
    const timer = setTimeout(() => {
      setAdminClickCount(0);
    }, 2000);
    setAdminClickTimer(timer);

    if (newCount >= 3) {
      setAdminClickCount(0);
      clearTimeout(timer);
      navigate('/admin');
    }
  }

  if (!userName) {
    return (
      <div className="lobby-page">
        <div className="admin-trigger" onClick={handleAdminTrigger} />
        <h1 className="app-title">Othello Meister</h1>
        <UserSelect />
      </div>
    );
  }

  return (
    <div className="lobby-page">
      <div className="admin-trigger" onClick={handleAdminTrigger} />
      <header className="lobby-header">
        <h1 className="app-title">Othello Meister</h1>
        <div className="user-info">
          <span className="user-name">{userName}</span>
          <button className="btn btn-small" onClick={logout}>ログアウト</button>
        </div>
      </header>

      <div className="lobby-tabs">
        <button
          className={`tab ${!showStats ? 'active' : ''}`}
          onClick={() => setShowStats(false)}
        >
          ルーム一覧
        </button>
        <button
          className={`tab ${showStats ? 'active' : ''}`}
          onClick={() => setShowStats(true)}
        >
          戦績
        </button>
      </div>

      {showStats ? <StatsView /> : <RoomList />}
    </div>
  );
}
