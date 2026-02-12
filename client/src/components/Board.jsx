import React from 'react';
import Cell from './Cell';

const EMPTY_BOARD = Array.from({ length: 8 }, () => Array(8).fill(0));

export default function Board({ board, validMoves = [], lastFlipped = [], lastMove, meisterData, onCellClick }) {
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
    <div className="board">
      {displayBoard.map((row, r) => (
        <div className="board-row" key={r}>
          {row.map((cell, c) => {
            const key = `${r},${c}`;
            return (
              <Cell
                key={key}
                value={cell}
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
    </div>
  );
}
