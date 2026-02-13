import React from 'react';
import Cell from './Cell';

const EMPTY_BOARD = Array.from({ length: 8 }, () => Array(8).fill(0));

export default function Board({ board, validMoves = [], lastFlipped = [], lastMove, meisterData, onCellClick, idle, quote }) {
  const displayBoard = board || EMPTY_BOARD;

  const validMoveSet = new Set(validMoves.map(m => `${m.row},${m.col}`));
  const flippedSet = new Set(lastFlipped.map(([r, c]) => `${r},${c}`));

  // Meister move analysis map
  const meisterMoveMap = {};
  if (meisterData?.analysis) {
    for (const item of meisterData.analysis) {
      meisterMoveMap[`${item.move.row},${item.move.col}`] = item.rank;
    }
  }

  return (
    <div className={`board ${idle ? 'board--idle' : ''}`}>
      {displayBoard.map((row, r) => (
        <div className="board-row" key={r}>
          {row.map((cell, c) => {
            const key = `${r},${c}`;
            return (
              <Cell
                key={key}
                value={idle ? 0 : cell}
                isValid={validMoveSet.has(key)}
                isFlipping={flippedSet.has(key)}
                isLastMove={lastMove && lastMove.row === r && lastMove.col === c}
                meisterRank={meisterMoveMap[key]}
                onClick={() => onCellClick(r, c)}
              />
            );
          })}
        </div>
      ))}
      {idle && (
        <div className="board-idle-frame">
          <div className="board-gold-corner tl" />
          <div className="board-gold-corner tr" />
          <div className="board-gold-corner bl" />
          <div className="board-gold-corner br" />
          <div className="board-gold-border" />
        </div>
      )}
      {idle && quote && (
        <div className="board-quote-overlay" key={quote.text}>
          <div className="board-quote-ornament top">&#10045;</div>
          <div className="board-quote-mark">&ldquo;</div>
          <div className="board-quote-text">{quote.text}</div>
          <div className="board-quote-divider">
            <span className="divider-diamond">&#9670;</span>
          </div>
          <div className="board-quote-character">{quote.character}</div>
          <div className="board-quote-source">— Othello</div>
          <div className="board-quote-ornament bottom">&#10045;</div>
        </div>
      )}
    </div>
  );
}
