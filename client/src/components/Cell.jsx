import React from 'react';

const BLACK = 1;
const WHITE = 2;

export default function Cell({ value, isValid, isFlipping, isLastMove, meisterRank, onClick }) {
  let className = 'cell';
  if (isValid) className += ' valid';
  if (isFlipping) className += ' flipping';
  if (isLastMove) className += ' last-move';
  if (meisterRank) className += ` meister-${meisterRank}`;

  return (
    <div className={className} onClick={onClick}>
      {value !== 0 && (
        <div className={`stone ${value === BLACK ? 'black' : 'white'} ${isFlipping ? 'flip-anim' : ''}`} />
      )}
      {isValid && value === 0 && <div className="valid-dot" />}
    </div>
  );
}
