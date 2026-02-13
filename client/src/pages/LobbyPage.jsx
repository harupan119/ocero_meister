import React, { useState } from 'react';
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
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
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
      setShowAdminModal(true);
      setAdminPassword('');
      setAdminError('');
    }
  }

  function handleAdminLogin(e) {
    e.preventDefault();
    if (adminPassword === 'administrator') {
      setShowAdminModal(false);
      navigate('/admin', { state: { authenticated: true, password: adminPassword } });
    } else {
      setAdminError('パスワードが違います');
    }
  }

  if (!userName) {
    return (
      <div className="lobby-page">
        <div className="admin-trigger" onClick={handleAdminTrigger} />
        <h1 className="app-title">Othello Meister</h1>
        <UserSelect />
        {showAdminModal && (
          <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>管理者認証</h3>
              <form onSubmit={handleAdminLogin} className="admin-modal-form">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  autoFocus
                />
                {adminError && <p className="error">{adminError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn" onClick={() => setShowAdminModal(false)}>キャンセル</button>
                  <button type="submit" className="btn btn-primary">ログイン</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lobby-page">
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
