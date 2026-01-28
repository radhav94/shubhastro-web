import { Heart, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";
import SectionHeader from "./SectionHeader";
import styles from "../Home.module.scss";

const LifeAreaSection = () => {
  const navigate = useNavigate();

  return (
    <section className={styles.lifeAreaSection}>
      <SectionHeader title="EXPLORE BY LIFE AREA" />

      <div className={styles.lifeAreaGrid}>
        <Link
          className={styles.lifeAreaCard}
          to={PATH.privateRoutes.Chat_With_ASTROLOGER.path}
          state={{
            selectedType: "Love",
          }}
          style={{
            background: "linear-gradient(135deg, #FFE5F0 0%, #FFF0F8 100%)",
            cursor: "pointer",
          }}
        >
          <h3 className={styles.lifeAreaTitle}>
            Love &<br />
            Relationships
          </h3>
          <div
            className={styles.lifeAreaIcon}
            style={{ background: "#FF6B9D" }}
          >
            <Heart size={32} color="#FFFFFF" fill="#FFFFFF" />
          </div>
        </Link>

        <Link
          className={styles.lifeAreaCard}
          to={PATH.privateRoutes.Chat_With_ASTROLOGER.path}
          state={{
            selectedType: "Health",
          }}
          style={{
            background: "linear-gradient(135deg, #E3F2FD 0%, #F0F8FF 100%)",
          }}
        >
          <h3 className={styles.lifeAreaTitle}>
            Health &<br />
            Wellbeing
          </h3>
          <div
            className={styles.lifeAreaIcon}
            style={{ background: "#4A90E2" }}
          >
            <Plus size={32} color="#FFFFFF" strokeWidth={3} />
          </div>
        </Link>

        <Link
          className={`${styles.lifeAreaCard} ${styles.lifeAreaCardMain}`}
          to={PATH.privateRoutes.Chat_With_ASTROLOGER.path}
          state={{
            selectedType: "Wealth & Finances",
          }}
        >
          <h3 className={styles.lifeAreaTitle}>
            Health &<br />
            Wellbeing
          </h3>
          <div className={`${styles.lifeAreaIcon} ${styles.wealthFinance}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M18.1152 4.53748C22.3477 4.53748 24.4644 4.53718 25.7793 5.85193C27.0942 7.16681 27.0938 9.28349 27.0938 13.516V13.89C27.0938 18.1226 27.0942 20.2392 25.7793 21.5541C24.4644 22.869 22.3478 22.8685 18.1152 22.8685H9.88477C5.65229 22.8685 3.53558 22.869 2.2207 21.5541C0.906002 20.2392 0.90625 18.1224 0.90625 13.89V13.516C0.90625 9.28351 0.905835 7.16681 2.2207 5.85193C3.53558 4.53705 5.65229 4.53748 9.88477 4.53748H18.1152ZM20.833 18.1439C20.1564 18.1439 19.6076 18.693 19.6074 19.3695C19.6074 20.0462 20.1563 20.5951 20.833 20.5951H23.166C23.8427 20.5951 24.3916 20.0462 24.3916 19.3695C24.3914 18.693 23.8426 18.1439 23.166 18.1439H20.833ZM14 10.2035C12.067 10.2035 10.5 11.7705 10.5 13.7035C10.5002 15.6363 12.0671 17.2035 14 17.2035C15.9329 17.2035 17.4998 15.6363 17.5 13.7035C17.5 11.7705 15.933 10.2035 14 10.2035ZM14 12.6537C14.5796 12.6537 15.0498 13.1239 15.0498 13.7035C15.0496 14.283 14.5795 14.7533 14 14.7533C13.4205 14.7533 12.9504 14.283 12.9502 13.7035C12.9502 13.1239 13.4204 12.6537 14 12.6537ZM4.83301 6.81091C4.15632 6.81091 3.60742 7.35981 3.60742 8.0365C3.60742 8.71319 4.15632 9.26208 4.83301 9.26208H7.16602C7.84271 9.26208 8.3916 8.71319 8.3916 8.0365C8.3916 7.35981 7.84271 6.81091 7.16602 6.81091H4.83301Z" fill="white"/>
            </svg>
          </div>
        </Link>

        <Link
          className={`${styles.lifeAreaCard} ${styles.lifeAreaCardMain}`}
          to={PATH.privateRoutes.Chat_With_ASTROLOGER.path}
          state={{
            selectedType: "Career & Growth",
          }}
          style={{
            background: "linear-gradient(135deg, #F6E9FF 30.13%, #BC89E3 215.45%)",
          }}
        >
          <h3 className={styles.lifeAreaTitle}>
            Career & <br />
            Growth
          </h3>
          <div className={styles.lifeAreaIcon} style={{
            background: "linear-gradient(135deg, #BC89E3 13.58%, #9544D3 86.67%)",
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M19.9065 6.69734C22.1284 5.9567 23.2398 5.58679 23.8264 6.17293C24.4129 6.75945 24.0428 7.87059 23.302 10.0928L20.0461 19.8604C18.9935 23.0184 18.4674 24.5974 17.5002 24.5977C16.5329 24.5977 16.0061 23.0187 14.9534 19.8604L14.2239 17.6739L19.6995 12.1993C20.2234 11.6752 20.2233 10.825 19.6995 10.3009C19.1754 9.77677 18.3252 9.77684 17.801 10.3009L12.3264 15.7745L10.1389 15.047C6.98092 13.9943 5.40172 13.4673 5.40161 12.5001C5.40161 11.5328 6.98085 11.0059 10.1389 9.9532L19.9065 6.69734Z" fill="white"/>
          </svg>
          </div>
        </Link>

      </div>
    </section>
  );
};

export default LifeAreaSection;
