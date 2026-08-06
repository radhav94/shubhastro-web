import React from "react";
import styles from "./HoroScopeBanner.module.scss";
import PrimaryText from "../../../../component/PrimaryText";
import { appColors } from "../../../../utils/theme";

const HoroScopeBanner = ({ onClickSign, data }) => {
  // Each read below used `data?.x ?? data.y`, where the fallback dereferences
  // `data` without a guard — so optional chaining on the left protected nothing
  // and an undefined `data` threw during render. Bail out instead of crashing
  // the whole horoscope page.
  if (!data) return null;

  return (
    <div className={styles.zodiacHeader}>
      <div className={styles.zodiacLeft}>
        <div className={styles.zodiacCls}>
          <img
            className={styles.zodiacMain}
            src={data.leftimg ?? data.bannerImg}
            alt="daily horoscope"
            title="Horoscope"
          />
        </div>
        <PrimaryText as="h1" isBold size_20 paddingTop={12} paddingBottom={12}>
          {data.header ?? `${data.name ?? ""} Horoscope`}
        </PrimaryText>
        <PrimaryText size_14>{data?.description}</PrimaryText>
      </div>

      <div className={styles.zodiacRight}>
        <div className={styles.rashisContainer}>
          {(data.zodiacSigns || []).map((e) => {
            let isActive = e?.isSelected ?? false;

            return (
              <div
                key={e.id}
                className={styles.card}
                style={{
                  backgroundColor: isActive ? appColors.tri : appColors.sec,
                }}
                onClick={() => onClickSign(e)}
              >
                <div>
                  <img src={e.img} alt={e.name} />
                </div>
                <PrimaryText isWhite={isActive}>{e.name}</PrimaryText>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HoroScopeBanner;
