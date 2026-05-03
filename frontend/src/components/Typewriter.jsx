import React, { useState, useEffect } from 'react';

export default function Typewriter({ text, speed = 30 }) {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayText}</span>;
}
