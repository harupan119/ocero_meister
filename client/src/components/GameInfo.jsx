import React from 'react';

const BLACK = 1;
const WHITE = 2;

function formatTime(ms) {
  if (ms == null) return '--:--';
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function GameInfo({ roomState, myRole, timers, disconnectedPlayer }) {
  if (!roomState) return null;

  const game = roomState.game;
  const blackPlayer = roomState.players[BLACK] || '---';
  const whitePlayer = roomState.players[WHITE] || '---';

  const pieces = game?.pieces || { black: 2, white: 2 };
  const isBlackTurn = game?.currentTurn === BLACK;
  const isPlaying = game?.status === 'playing';

  return (
    <div className="game-info">
      <div className={`player-info black-info ${isPlaying && isBlackTurn ? 'active-turn' : ''}`}>
        <div className="player-stone">
          <div className="stone black" />
        </div>
        <div className="player-details">
          <span className="player-name">{blackPlayer}</span>
          <span className="piece-count">{pieces.black}</span>
        </div>
        {timers && (
          <span className={`timer ${isBlackTurn ? 'active' : ''}`}>
            {formatTime(timers[BLACK])}
          </span>
        )}
      </div>

      <div className="turn-indicator">
        {isPlaying ? (
          <span>{isBlackTurn ? '黒の番' : '白の番'}</span>
        ) : game?.status === 'finished' ? (
          <span>終了</span>
        ) : (
          <span>待機中</span>
        )}
      </div>

      <div className={`player-info white-info ${isPlaying && !isBlackTurn ? 'active-turn' : ''}`}>
        <div className="player-stone">
          <div className="stone white" />
        </div>
        <div className="player-details">
          <span className="player-name">{whitePlayer}</span>
          <span className="piece-count">{pieces.white}</span>
        </div>
        {timers && (
          <span className={`timer ${!isBlackTurn ? 'active' : ''}`}>
            {formatTime(timers[WHITE])}
          </span>
        )}
      </div>

      {disconnectedPlayer && (
        <div className="disconnect-warning">
          {disconnectedPlayer}が切断しました（30秒以内に再接続しないと棄権）
        </div>
      )}
    </div>
  );
}
