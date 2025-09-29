import { useNavigate } from "react-router-dom";
import {
  Divider,
  LiveAstroCard,
  PrimaryButton,
  PrimaryText,
} from "../../../../../component";
import { AppImages } from "../../../../../utils/appImages";
import { appData } from "../../../../../utils/constanats/appData";
import styles from "./LiveShows.module.scss";

import { GrFormNext } from "react-icons/gr";
import { PATH } from "../../../../../utils/routes/Paths";
const LiveShows = ({ onWatchNow }) => {
  const data = appData.slice(0, 5);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <PrimaryText isBold size_24 className={styles.headerTitle}>
          Live Shows
        </PrimaryText>
        <Divider responsive />
        <PrimaryButton width={"100px"} title="View All" />
      </div>

      <div className={styles.cardsContainer}>
        {data.map((astrologer) => (
          <div
            key={astrologer.AstrologerLoginId}
            className={styles.cardWrapper}
          >
            <LiveAstroCard data={astrologer} onWatchNow={onWatchNow} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveShows;
