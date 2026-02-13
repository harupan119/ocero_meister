import React from 'react';

const COL_LABELS = 'ABCDEFGH';

export default function MeisterOverlay({ data, analyzing }) {
  const bestMove = data?.analysis?.[0];
  const bestMoveLabel = bestMove
    ? `${COL_LABELS[bestMove.move.col]}${bestMove.move.row + 1}`
    : null;

  return (
    <div className="meister-overlay">
      <div className="meister-badge">MEISTER MODE</div>
      {analyzing && <div className="meister-analyzing">解析中...</div>}
      {data && !analyzing && (
        <>
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
          {bestMove && bestMove.reasons && bestMove.reasons.length > 0 && (
            <div className="meister-lesson">
              <div className="meister-lesson-title">
                最善手 ({bestMoveLabel}):
              </div>
              <ul className="meister-lesson-reasons">
                {bestMove.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
