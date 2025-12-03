// Notifications.jsx
import React, { useState } from 'react';
import NotificationBox from './NotificationBox';
import styles from './Notification.module.scss';

const Notification = () => {
const [notifications] = useState([
  {
    id: 1,
    emoji: '🌟',
    title: 'New Year, New Beginnings!',
    endEmoji: '🎉',
    text: 'Start 2023 on the right foot! Get your horoscope for the year ahead and plan for success 💫',
    date: '1 Jan 2023'
  },
  {
    id: 2,
    title: 'Stuck in a tough spot?',
    endEmoji: '💭',
    text: 'Our top counsellors are here to listen and guide you through your challenges. Chat with us today! 💬',
    date: '15 Dec 2022'
  },
  {
    id: 3,
    emoji: '💡',
    title: 'Find Your True Calling!',
    text: 'Discover your strengths and unlock your potential with a free tarot reading. Your future awaits 🌟',
    date: '5 Dec 2022'
  },
  {
    id: 4,
    title: 'Struggling with Love?',
    text: 'Our expert love counsellors are here to help you through the tough moments. Speak to one today 💕',
    date: '22 Nov 2022'
  },
  {
    id: 5,
    title: 'Weekly Horoscope Alert!',
    endEmoji: '✨',
    text: 'Find out what the stars have in store for you this week—love, career, health, and more 🌙',
    date: '10 Nov 2022'
  }
]);


  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.col12}>
          <h1 className={styles.mainHeading}>Notifications</h1>
        </div>
      </div>
      <div className={`${styles.row} ${styles.justifyCenter}`}>
        <div className={styles.notificationsContainer}>
          {notifications.map(notification => (
            <NotificationBox 
              key={notification.id} 
              notification={notification} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notification;

