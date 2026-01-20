// NotificationBox.jsx
import React from 'react';
import styles from './Notification.module.scss';

const NotificationBox = ({ notification }) => {
  return (
    <div className={styles.notificationBox}>
      <div className={styles.notificationHeading}>
        {notification.emoji && <span className={styles.emoji}>{notification.emoji}</span>}
        {notification.title}
        {notification.endEmoji && <span className={styles.endEmoji}>{notification.endEmoji}</span>}
      </div>
      <div className={styles.notificationText}>{notification.text}</div>
      <div className={styles.date}>{notification.date}</div>
    </div>
  );
};

export default NotificationBox;