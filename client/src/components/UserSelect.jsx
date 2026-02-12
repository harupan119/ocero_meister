import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';

export default function UserSelect() {
  const { login } = useAppContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="user-select"><p>読み込み中...</p></div>;
  }

  return (
    <div className="user-select">
      <h2>ユーザーを選択</h2>
      <div className="user-grid">
        {users.map(name => (
          <button
            key={name}
            className="btn user-btn"
            onClick={() => login(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
