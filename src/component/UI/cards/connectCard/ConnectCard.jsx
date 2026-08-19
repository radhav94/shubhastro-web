import styles from "./ConnectCard.module.scss";
import { FiPhoneCall } from "react-icons/fi";
import { BsChatDots } from "react-icons/bs";
import { Link } from "react-router-dom";
import askToAsrtroDesktop from "../../../../assets/images/ask-an-astrologer.png";
import askToAsrtroMob from "../../../../assets/images/ask-an-astrologer-mob.png";

const ConnectCard = () => {
  return (
    <div className={styles.connectCard}>
      {/*
        The call to action is a <span>, not a <button>.

        It used to be `<button>` nested inside this `<Link>`. An <a> may not
        contain interactive content, and Chrome resolves that by letting the
        button consume the activation — so the anchor never navigated. The
        button carried no onClick of its own, so tapping the one element that
        actually says "Consult with an Astrologer" did nothing at all. Only the
        banner image around it worked. This component renders on ~20 calculator
        report screens and on match details, so that dead tap was on every
        calculator result page.

        A span keeps the same styling (Tailwind preflight already made the
        button inherit the page font, so nothing shifts) and leaves the Link as
        the single interactive element, which means the label is now part of the
        link's own hit area.

        The images are decorative next to that label, so their alt is empty —
        otherwise the link announces as "ask to astrologer ask to astrologer
        Consult with an Astrologer".
      */}
      <Link to="/astrologers">
        <img src={askToAsrtroDesktop} className={styles.askToAsrtroDesktop} alt="" />
        <img src={askToAsrtroMob} className={styles.askToAsrtroMob} alt="" />
        <span className={styles.askAnAstrobtn}>Consult with an Astrologer</span>
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
