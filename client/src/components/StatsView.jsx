import React, { useState, useEffect } from 'react';

export default function StatsView() {
  const [stats, setStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="stats-view"><p>読み込み中...</p></div>;
  if (!stats) return <div className="stats-view"><p>データなし</p></div>;

  const users = Object.keys(stats).sort((a, b) => {
    const aRate = stats[a].games > 0 ? stats[a].wins / stats[a].games : 0;
    const bRate = stats[b].games > 0 ? stats[b].wins / stats[b].games : 0;
    return bRate - aRate;
  });

  return (
    <div className="stats-view">
      <table className="stats-table">
        <thead>
          <tr>
            <th>#</th>
            <th>プレイヤー</th>
            <th>勝</th>
            <th>負</th>
            <th>引</th>
            <th>勝率</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => {
            const s = stats[user];
            const rate = s.games > 0 ? Math.round((s.wins / s.games) * 100) : 0;
            return (
              <tr
                key={user}
                className={selectedUser === user ? 'selected' : ''}
                onClick={() => setSelectedUser(selectedUser === user ? null : user)}
              >
                <td>{i + 1}</td>
                <td>{user}</td>
                <td>{s.wins}</td>
                <td>{s.losses}</td>
                <td>{s.draws}</td>
                <td>{rate}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedUser && stats[selectedUser] && (
        <div className="head-to-head">
          <h3>{selectedUser} の対戦成績</h3>
          <table className="stats-table small">
            <thead>
              <tr>
                <th>相手</th>
                <th>勝</th>
                <th>負</th>
                <th>引</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats[selectedUser].opponents).map(([opp, record]) => (
                <tr key={opp}>
                  <td>{opp}</td>
                  <td>{record.wins}</td>
                  <td>{record.losses}</td>
                  <td>{record.draws}</td>
                </tr>
              ))}
              {Object.keys(stats[selectedUser].opponents).length === 0 && (
                <tr><td colSpan={4}>対戦記録なし</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
