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
      </div>
    </section>
  );
};

export default LifeAreaSection;
