import styles from "./ConnectCard.module.scss";
import { FiPhoneCall } from "react-icons/fi";
import { BsChatDots } from "react-icons/bs";
import { Link } from "react-router-dom";
import askToAsrtroDesktop from "../../../../assets/images/ask-an-astrologer.png";
import askToAsrtroMob from "../../../../assets/images/ask-an-astrologer-mob.png";

const ConnectCard = () => {
  return (
    <div className={styles.connectCard}>
      <Link to="/astrologers">
        <img src={askToAsrtroDesktop} className={styles.askToAsrtroDesktop} alt="ask to astrologer" />
        <img src={askToAsrtroMob} className={styles.askToAsrtroMob} alt="ask to astrologer" />
        <button className={styles.askAnAstrobtn}>Consult with an Astrologer</button>
      </Link>
      {/* <p className={styles.title}>
        When will I be financially stable? Talk to our expert astrologers for
        personalized guidance.
      </p> */}

      {/* <div className={styles.buttons}>
        <Link to="/astrologers" className={styles.btn}>
          <FiPhoneCall className={styles.icon} />
          Talk to Astrologer
        </Link>

        <Link to="/astrologers" className={styles.btn}>
          <BsChatDots className={styles.icon} />
          Chat with Astrologer
        </Link>
      </div> */}
    </div>
  );
};

export default ConnectCard;
