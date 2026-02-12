import React from 'react';

export default function GameResult({ result, userName, onClose }) {
  if (!result) return null;

  const isDraw = !result.winner;
  const isWinner = result.winnerName === userName;
  const isLoser = result.loserName === userName;

  let reasonText = '';
  if (result.reason === 'forfeit') reasonText = '（棄権）';
  else if (result.reason === 'timeout') reasonText = '（時間切れ）';

  let resultClass = 'game-result';
  if (isWinner) resultClass += ' win';
  else if (isLoser) resultClass += ' lose';
  else resultClass += ' draw';

  return (
    <div className="game-result-overlay" onClick={onClose}>
      <div className={resultClass} onClick={(e) => e.stopPropagation()}>
        <h2>
          {isDraw ? '引き分け' : isWinner ? 'YOU WIN!' : isLoser ? 'YOU LOSE...' : `${result.winnerName} の勝ち`}
        </h2>
        <p className="result-reason">{reasonText}</p>
        <div className="result-scores">
          <div className="result-score black-score">
            <div className="stone black" />
            <span className="score-number">{result.pieces.black}</span>
            <span className="score-name">{result.blackPlayer}</span>
          </div>
          <span className="result-dash">-</span>
          <div className="result-score white-score">
            <span className="score-number">{result.pieces.white}</span>
            <div className="stone white" />
            <span className="score-name">{result.whitePlayer}</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '20px' }}>
          閉じる
        </button>
      </div>
    </div>
  );
}
