import styles from "./Compatibility.module.scss";
import { zodiacList } from "./zodiacList";
import { Link } from "react-router-dom";
import DividerWithImage from "../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../assets/icons/logo.png";
import ConnectWithAstrologer from "./ConnectWithAstrologer";

const CompatibilityLanding = () => {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Compatibility</h1>
      <p className={styles.subtitle}>Check your love compatibility</p>

      <DividerWithImage imageSrc={ShubhTalkLogo} />

      {/* <section className={styles.introBox}>
        <p>
            You don't always get along like a blaze on flames. Sometimes the spark feels missing,
          sometimes it feels magical. Astrology helps you understand the underlying cosmic
          connection between two people.
        </p>
        <p>
          Do you believe your heart might have jumped a beat when you met someone? Let the stars
          guide you toward understanding whether this bond is meant to grow or fade.
        </p>
      </section> */}

      <div className={styles.introBox}><p>You don't always get along like a blaze on flames with people, but when you're with that "special person," you feel happy and in control of the situation. We encounter numerous people throughout life. One person would be your life partner out of all those who may be terrific friends or mentors for you. You must make the appropriate choice for that person. They must make you feel at home, never depressed or too uncared for.</p>
        <p>Do you believe your heart might have jumped a beat if you had met that particular someone? If so, find out what your Sun sign conspires to have you do by checking your zodiac sign love compatibility.</p></div>
        
        <ConnectWithAstrologer/>

      <div className={styles.introBox}><p>Zodiac sign compatibility reveals more than just compatibility in romantic relationships. You can also find information on your partner's and your own zodiac love and sexual compatibility. This can ensure a long-lasting relationship with shared understanding while also assisting you in learning further about your mate and your bond. </p>
        <p>Love compatibility can also forecast how your relationship will develop in the future, in addition to letting you know how things stand right now. Moreover, it reveals the strength of your current bond, what makes it successful, and if you and your loved one are about to experience harmony or conflict in the future. Hence, you may determine whether your connection is likely to progress in the ways you want by simply entering the appropriate zodiac sign. Kudos if your sign and your partner's sign align! Seamless times are predictable in advance.</p></div>

      <h2 className={styles.chooseTitle}>Choose Your Sign</h2>

      <div className={styles.signGrid}>
        {zodiacList.map((z) => (
          <Link key={z.id} to={`/compatibility/select/${z.id}`}>
            <div className={styles.signCard}>
                <div className={styles.imageWrapper}>
                    <img src={z.img} alt={z.name} className={styles.image} />
                </div>
              <h4>{z.name}</h4>
              <p>{z.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CompatibilityLanding;
