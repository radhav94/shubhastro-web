import React from "react";
import styles from "./InternalBanner.module.scss";
import { motion } from "framer-motion";
import PrimaryText from "../../../../component/PrimaryText";
import { AppImages } from "../../../../utils/appImages";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardsGridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const InternalBanner = ({ onCardClick, data }) => {
  if (!data) return null;

  const { bannerImg, bannerName, bannerDescription, cards = [] } = data;

  return (
    <motion.div
      className={styles.bannerContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --- LEFT SECTION --- */}
      <div className={styles.bannerLeft}>
        <motion.div className={styles.imageWrapper} variants={itemVariants}>
          <img
            className={styles.mainImage}
            src={bannerImg || AppImages.Hero}
            alt={bannerName || "Banner"}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <PrimaryText as="h1" isBold size_24 className={styles.bannerTitle}>
            {bannerName}
          </PrimaryText>
        </motion.div>

        {bannerDescription && (
          <motion.div
            className={styles.bannerDescription}
            variants={itemVariants}
          >
            <PrimaryText size_14>{bannerDescription}</PrimaryText>
          </motion.div>
        )}
      </div>

      {/* --- RIGHT SECTION (CARDS GRID) --- */}
      <motion.div className={styles.bannerRight} variants={cardsGridVariants}>
        {cards.map((card) => {
          const { id, name, img, isSelected } = card;
          const isActive = !!isSelected;

          return (
            <motion.div
              key={id}
              className={`${styles.card} ${isActive ? styles.active : ""}`}
              onClick={() => onCardClick?.(card)}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <div className={styles.cardImage}>
                <img src={img} alt={name} />
              </div>
              <PrimaryText
                isSemiBold
                size_14
                color={isActive ? "#1a1a1a" : "#555555"}
              >
                {name}
              </PrimaryText>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default InternalBanner;
