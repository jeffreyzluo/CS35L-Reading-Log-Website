import React, { useEffect, useRef, useState } from 'react';
import './Notification.css';

function Notification({ message, type = 'success', duration = 3000, onClose }) {
  const timerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    // Show immediately
    setVisible(true);

    // Start auto-dismiss: first hide (for transition), then call onClose after transition
    if (timerRef.current) clearTimeout(timerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      // wait for CSS transition (250ms) then call onClose
      closeTimerRef.current = setTimeout(() => {
        if (onClose) onClose();
      }, 250);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [message, duration, onClose]);

  if (!message) return null;

  const cls = `notification notification--${type} ${visible ? 'notification--visible' : ''}`;

  return (
    <div role="status" aria-live="polite" className={cls}>
      {message}
    </div>
  );
}

export default Notification;
