import React, { useState, useEffect } from 'react';

export default function AdminPanel({ password }) {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [editingStats, setEditingStats] = useState({});
  const [statsMsg, setStatsMsg] = useState('');

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  function loadUsers() {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(() => {});
  }

  function loadStats() {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data);
        const editing = {};
        for (const [name, s] of Object.entries(data)) {
          editing[name] = { wins: s.wins, losses: s.losses, draws: s.draws };
        }
        setEditingStats(editing);
      })
      .catch(() => {});
  }

  function addUser(e) {
    e.preventDefault();
    if (!newUser.trim()) return;

    fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: JSON.stringify({ name: newUser.trim() }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setUsers(data.users);
          setNewUser('');
          setError('');
        }
      })
      .catch(() => setError('通信エラー'));
  }

  function removeUser(name) {
    if (!confirm(`${name} を削除しますか？`)) return;

    fetch(`/api/admin/users/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Password': password },
    })
      .then(r => r.json())
      .then(data => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  }

  function handleStatChange(name, field, value) {
    const num = parseInt(value, 10);
    setEditingStats(prev => ({
      ...prev,
      [name]: { ...prev[name], [field]: isNaN(num) ? 0 : num },
    }));
  }

  function saveStat(name) {
    const s = editingStats[name];
    fetch(`/api/admin/stats/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: JSON.stringify({ wins: s.wins, losses: s.losses, draws: s.draws }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatsMsg(`${name} の戦績を保存しました`);
          setTimeout(() => setStatsMsg(''), 2000);
          loadStats();
        }
      })
      .catch(() => setStatsMsg('保存に失敗しました'));
  }

  function resetHistory() {
    if (!confirm('全ゲーム履歴をリセットしますか？この操作は元に戻せません。')) return;

    fetch('/api/admin/stats/reset', {
      method: 'POST',
      headers: { 'X-Admin-Password': password },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatsMsg('履歴をリセットしました');
          setTimeout(() => setStatsMsg(''), 2000);
          loadStats();
        }
      })
      .catch(() => setStatsMsg('リセットに失敗しました'));
  }

  const statNames = Object.keys(editingStats);

  return (
    <div className="admin-panel">
      <section>
        <h3>ユーザー管理</h3>
        <form onSubmit={addUser} className="add-user-form">
          <input
            type="text"
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            placeholder="新しいユーザー名"
          />
          <button type="submit" className="btn btn-primary">追加</button>
        </form>
        {error && <p className="error">{error}</p>}

        <ul className="user-list">
          {users.map(user => (
            <li key={user}>
              <span>{user}</span>
              <button className="btn btn-danger btn-small" onClick={() => removeUser(user)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-stats-section">
        <h3>戦績管理</h3>
        {statsMsg && <p className="stats-msg">{statsMsg}</p>}
        <div className="admin-stats-table-wrap">
          <table className="admin-stats-table">
            <thead>
              <tr>
                <th>ユーザー</th>
                <th>勝</th>
                <th>負</th>
                <th>引</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {statNames.map(name => (
                <tr key={name}>
                  <td className="stat-name">{name}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={editingStats[name].wins}
                      onChange={e => handleStatChange(name, 'wins', e.target.value)}
                      className="stat-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={editingStats[name].losses}
                      onChange={e => handleStatChange(name, 'losses', e.target.value)}
                      className="stat-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={editingStats[name].draws}
                      onChange={e => handleStatChange(name, 'draws', e.target.value)}
                      className="stat-input"
                    />
                  </td>
                  <td>
                    <button className="btn btn-primary btn-small" onClick={() => saveStat(name)}>
                      保存
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-danger" onClick={resetHistory} style={{ marginTop: '12px' }}>
          履歴リセット
        </button>
      </section>
    </div>
  );
}
