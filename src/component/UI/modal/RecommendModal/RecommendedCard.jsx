import PrimaryButton from "../../../PrimaryButton";
import styles from "./recommendedCard.module.scss";
import { AppIcons } from "../../../../utils/appImages";
import { appColors } from "../../../../utils/theme";

const RecommendedCard = ({ astro, onChat, onAudioCall, onVideoCall }) => {
  return (
    <>
      <div className={styles.card}>
        <img src={astro?.imageUrl} alt={astro?.firstName} />

        <h4>{astro?.firstName}</h4>

        <div className={styles.buttonsRow}>
          <PrimaryButton
            bgColor={appColors.white}
            imgSrc={AppIcons.Message}
            imgSize={20}
            buttonStyles={{ padding: "2px" }}
            onClick={onChat}
          />

          <PrimaryButton
            bgColor={appColors.white}
            imgSrc={AppIcons.Call}
            imgSize={20}
            buttonStyles={{ padding: "2px" }}
            // onClick={onAudioCall}
          />

          <PrimaryButton
            bgColor={appColors.white}
            imgSrc={AppIcons.Video}
            imgSize={20}
            buttonStyles={{ padding: "2px" }}
            // onClick={onVideoCall}
          />
        </div>
      </div>
    </>
  );
};

export default RecommendedCard;
