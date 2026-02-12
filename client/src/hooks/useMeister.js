import { useState, useEffect, useRef } from 'react';

// Map KeyboardEvent.code to the letter
const CODE_TO_CHAR = {
  KeyM: 'm', KeyE: 'e', KeyI: 'i', KeyS: 's', KeyT: 't', KeyR: 'r',
};

const TARGET = 'meister';
const ALLOWED_USER = '黒木';

export default function useMeister(userName) {
  const [active, setActive] = useState(false);
  const bufferRef = useRef('');
  const timerRef = useRef(null);

  useEffect(() => {
    // Only allowed user can activate
    if (userName !== ALLOWED_USER) {
      setActive(false);
      return;
    }

    function handleKeyDown(e) {
      if (!e.shiftKey) {
        bufferRef.current = '';
        return;
      }

      if (e.key === 'Shift') return;

      const char = CODE_TO_CHAR[e.code];
      if (!char) {
        bufferRef.current = '';
        return;
      }

      bufferRef.current += char;

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bufferRef.current = '';
      }, 3000);

      if (bufferRef.current === TARGET) {
        setActive(prev => !prev);
        bufferRef.current = '';
        clearTimeout(timerRef.current);
      }

      if (bufferRef.current.length > 0 && !TARGET.startsWith(bufferRef.current)) {
        bufferRef.current = '';
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timerRef.current);
    };
  }, [userName]);

  return { meisterActive: active && userName === ALLOWED_USER };
}
