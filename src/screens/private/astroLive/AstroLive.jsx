import React from "react";
import { PrimaryText, Title } from "../../../component";
import LiveAstroCard from "../../../component/UI/cards/LiveAstroCard";
import LiveModal from "../../../component/UI/modal/liveModal/LiveModal";
import WorkInProgressCard from "../../../component/UI/cards/WorkInProgressCard";
import { AppImages } from "../../../utils/appImages";

import styles from "./AstroLive.module.scss";
import { useAstrLive } from "./useAstroLive";

const AstroLive = () => {
  const [data, onWatchNow] = useAstrLive();

  return (
    <div>
      <img
        src={AppImages.AstroLiveBg}
        className="w-full rounded-lg shadow-md"
      />
      <PrimaryText as="h1" size_24 isBold className=" pt-4">
        Yogi Live! Now Chat with Your Favourite Astrologers for Free
      </PrimaryText>
      <PrimaryText className=" py-4">
        Join a free live session with India's best Astrologers, Tarot readers,
        Vaastu experts, Numerologists, life coaches, and many more, and ask
        questions through a live chat regarding love, relationships, career,
        marriage, finance, and more
      </PrimaryText>
      <Title title="Ongoing Live Sessions" showDivider />
      <div className={styles.cardsContainer}>
        {data.map((e) => (
          <div key={e.AstrologerLoginId} className={styles.cardWrapper}>
            <LiveAstroCard data={e} onWatchNow={onWatchNow} />
          </div>
        ))}
      </div>
      <Title title="Upcoming Sessions" showDivider />
      <div className={styles.cardsContainer}>
        {data
          .sort(() => Math.random() - 0.5)
          .map((e) => (
            <div key={e.AstrologerLoginId} className={styles.cardWrapper}>
              <LiveAstroCard data={e} onWatchNow={onWatchNow} upComing />
            </div>
          ))}
      </div>
    </div>
  );
};

export default AstroLive;
