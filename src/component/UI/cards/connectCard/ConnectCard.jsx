import styles from "./ConnectCard.module.scss";
import { FiPhoneCall } from "react-icons/fi";
import { BsChatDots } from "react-icons/bs";
import { Link } from "react-router-dom";

const ConnectCard = () => {
  return (
    <div className={styles.connectCard}>
      <p className={styles.title}>
        Connect with an Astrologer on Call or Chat for more personalised
        detailed predictions.
      </p>

      <div className={styles.buttons}>
        <Link to="/talk-to-astrologers" className={styles.btn}>
          <FiPhoneCall className={styles.icon} />
          Talk to Astrologer
        </Link>

        <Link to="/talk-to-astrologers" className={styles.btn}>
          <BsChatDots className={styles.icon} />
          Chat with Astrologer
        </Link>
      </div>
    </div>
  );
};

export default ConnectCard;
