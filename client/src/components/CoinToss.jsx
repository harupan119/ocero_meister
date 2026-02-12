import React, { useState, useEffect } from 'react';

export default function CoinToss({ result, onEnd }) {
  const [phase, setPhase] = useState('flipping'); // 'flipping' | 'result'

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('result'), 1500);
    const timer2 = setTimeout(() => onEnd(), 3500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onEnd]);

  return (
    <div className="coin-toss-overlay" onClick={onEnd}>
      <div className="coin-toss">
        <div className={`coin ${phase === 'flipping' ? 'spinning' : ''}`}>
          <div className="coin-face front">●</div>
          <div className="coin-face back">○</div>
        </div>
        {phase === 'result' && (
          <div className="coin-result">
            {result === 'black' ? '黒（先攻）' : '白（後攻）'}
          </div>
        )}
      </div>
    </div>
  );
}
