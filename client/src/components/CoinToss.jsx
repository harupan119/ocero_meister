import React, { useState, useEffect } from 'react';

export default function CoinToss({ result, onEnd }) {
  const [phase, setPhase] = useState('flipping'); // 'flipping' | 'result'

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('result'), 2000);
    const timer2 = setTimeout(() => onEnd(), 4000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onEnd]);

  const isBlack = result === 'black';

  return (
    <div className="coin-toss-overlay" onClick={phase === 'result' ? onEnd : undefined}>
      <div className="coin-toss">
        <div className="othello-coin-wrapper">
          <div className={`othello-coin ${phase === 'flipping' ? 'spinning' : (isBlack ? 'show-black' : 'show-white')}`}>
            <div className="othello-face othello-black">
              <div className="othello-stone-inner" />
            </div>
            <div className="othello-face othello-white">
              <div className="othello-stone-inner" />
            </div>
          </div>
        </div>
        {phase === 'result' && (
          <div className="coin-result">
            {isBlack ? '黒（先攻）' : '白（後攻）'}
          </div>
        )}
      </div>
    </div>
  );
}
