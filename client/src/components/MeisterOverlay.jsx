import React from 'react';

export default function MeisterOverlay({ data, analyzing }) {
  return (
    <div className="meister-overlay">
      <div className="meister-badge">MEISTER MODE</div>
      {analyzing && <div className="meister-analyzing">解析中...</div>}
      {data && !analyzing && (
        <div className="meister-info">
          <div className={`meister-evaluation ${data.evaluation}`}>
            {data.evaluation === 'advantage' && '優勢 ↑'}
            {data.evaluation === 'disadvantage' && '劣勢 ↓'}
            {data.evaluation === 'even' && '互角 ='}
          </div>
          <div className="meister-score">
            評価値: {data.overallScore > 0 ? '+' : ''}{data.overallScore}
          </div>
          <div className="meister-legend">
            <span className="legend-best">● 最善手</span>
            <span className="legend-worst">● 悪手</span>
          </div>
        </div>
      )}
    </div>
  );
}
