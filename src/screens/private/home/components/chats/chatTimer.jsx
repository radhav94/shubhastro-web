import React, { useMemo } from 'react';
import styles from './ChatWindow.module.scss';
import { useChat } from '../../../../../context/ChatContext';

const ChatTimer = () => {
  const { chatSeconds } = useChat();

  // Convert total seconds to minutes and seconds
  const minutes = Math.floor(chatSeconds / 60);
  const seconds = chatSeconds % 60;

  // Memoize the formatted minutes to avoid unnecessary re-renders
  const memoizedMinutes = useMemo(() => {
    return minutes.toString().padStart(2, '0');
  }, [minutes]);

  // Format the seconds for display
  const memoizedSeconds = useMemo(() => {
    return seconds.toString().padStart(2, '0');
  }, [seconds]);

  return (
    <div>
      <span className={styles.duration}>
        <span>{memoizedMinutes}</span>:<span>{memoizedSeconds}</span>
      </span>
    </div>
  );
};

export default ChatTimer;