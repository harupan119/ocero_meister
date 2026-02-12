import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    if (password === 'administrator') {
      setAuthenticated(true);
      setError('');
    } else {
      setError('パスワードが違います');
    }
  }

  if (!authenticated) {
    return (
      <div className="admin-page">
        <button className="btn btn-back" onClick={() => navigate('/')}>← 戻る</button>
        <h2>管理者認証</h2>
        <form onSubmit={handleLogin} className="admin-login-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            autoFocus
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary">ログイン</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <button className="btn btn-back" onClick={() => navigate('/')}>← 戻る</button>
      <h2>管理者パネル</h2>
      <AdminPanel password={password} />
    </div>
  );
}
