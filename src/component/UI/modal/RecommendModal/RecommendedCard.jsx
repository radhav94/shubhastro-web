import styles from "./recommendedCard.module.scss";

const RecommendedCard = ({ astro, onChat, onAudioCall, onVideoCall, mode }) => {
  return (
    <>
      <div className={styles.card}>
        <img src={astro?.imageUrl} alt={astro?.firstName} />

        <h4>{astro?.firstName}</h4>

        <div className={styles.buttonsRow}>
          {mode === "chat" ? (
            <button className={styles.connectBtn} onClick={onChat}>
              Connect
            </button>
          ) : (
            <button className={styles.connectBtn} onClick={onAudioCall}>
              Connect
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default RecommendedCard;
