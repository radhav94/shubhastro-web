import React from "react";
import styles from "./InternalBanner.module.scss";
import PrimaryText from "../../../../component/PrimaryText";
import { appColors } from "../../../../utils/theme";
import { AppImages } from "../../../../utils/appImages";

const InternalBanner = ({ onCardClick, data }) => {
  if (!data) return null;

  const { bannerImg, bannerName, bannerDiscription, cards = [] } = data;

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerLeft}>
        <div className={styles.imageWrapper}>
          <img
            className={styles.mainImage}
            src={bannerImg || AppImages.Hero}
            alt={bannerName || "Banner"}
          />
        </div>

        <PrimaryText as="h1" isBold size_20 paddingTop={12} paddingBottom={12}>
          {bannerName}
        </PrimaryText>

        {bannerDiscription && (
          <div className={styles.bannerDescription}>
            <PrimaryText size_14>{bannerDiscription}</PrimaryText>
          </div>
        )}
      </div>

      <div className={styles.bannerRight}>
        <div className={styles.cardsContainer}>
          {cards.map((card) => {
            const { id, name, img, isSelected } = card;
            const isActive = !!isSelected;

            return (
              <div
                key={id}
                className={styles.card}
                style={{
                  backgroundColor: isActive ? appColors.tri : appColors.sec,
                }}
                onClick={() => onCardClick?.(card)}
              >
                {img && (
                  <div className={styles.cardImage}>
                    <img src={img} alt={name} />
                  </div>
                )}
                <PrimaryText isWhite={isActive}>{name}</PrimaryText>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InternalBanner;
