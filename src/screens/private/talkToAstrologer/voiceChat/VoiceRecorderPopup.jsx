import styles from "./VoiceRecorderPopup.module.scss";

const formatTime = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

const VoiceRecorderPopup = ({ seconds, paused, onStop, onDelete, onPause, onResume }) => {
  return (
    <div className={styles.recordingBar}>
      {/* Delete (trash) button — left */}
      <button className={styles.deleteBtn} onClick={onDelete} title="Delete recording">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Waveform + timer */}
      <div className={styles.waveArea}>
        {/* Pulsing red dot — stops pulsing when paused */}
        <span className={`${styles.recDot} ${paused ? styles.recDotPaused : ''}`} />

        {/* Animated waveform bars — freeze when paused */}
        <div className={styles.waveform}>
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className={`${styles.bar} ${paused ? styles.barPaused : ''}`}
              style={{ animationDelay: `${(i * 0.08) % 1.2}s` }}
            />
          ))}
        </div>

        {/* Timer */}
        <span className={styles.timer}>{formatTime(seconds)}</span>
      </div>

      {/* Pause / Resume button — center-right */}
      <button
        className={styles.pauseBtn}
        onClick={paused ? onResume : onPause}
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? (
          /* Play icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        ) : (
          /* Pause icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        )}
      </button>

      {/* Send button — right */}
      <button className={styles.sendBtn} onClick={onStop} title="Send voice message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default VoiceRecorderPopup;
