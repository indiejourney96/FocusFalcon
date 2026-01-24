import React, { useState, useRef } from "react";

export default function HoldButton({ text, onHoldComplete, holdTime = 2000 }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  const startHold = () => {
    let start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / holdTime) * 100, 100);
      setProgress(pct);

      if (pct === 100) {
        clearInterval(intervalRef.current);
        onHoldComplete();
      }
    }, 16);
  };

  const cancelHold = () => {
    clearInterval(intervalRef.current);
    setProgress(0);
  };

  return (
    <button
      style={{
        position: "relative",
        width: "100%",
        padding: "8px",
        fontSize: "16px",
        cursor: "pointer"
      }}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
    >
      {text}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "4px",
          width: `${progress}%`,
          background: "rgba(255,0,0,0.6)",
          transition: "width 0.1s linear"
        }}
      />
    </button>
  );
}
