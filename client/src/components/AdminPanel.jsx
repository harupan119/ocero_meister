import React, { useState, useEffect } from 'react';

export default function AdminPanel({ password }) {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => setUsers(data))
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
    </div>
  );
}
