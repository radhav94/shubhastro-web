import PrimaryButton from "../../../PrimaryButton";
import styles from "./recommendedCard.module.scss";
import { AppIcons } from "../../../../utils/appImages";
import { appColors } from "../../../../utils/theme";

const RecommendedCard = ({ astro, onChat, onAudioCall, onVideoCall, mode }) => {
  return (
    <>
      <div className={styles.card}>
        <img src={astro?.imageUrl} alt={astro?.firstName} />

        <h4>{astro?.firstName}</h4>

        <div className={styles.buttonsRow}>
          {mode === "chat" ? (
            <PrimaryButton
              bgColor={appColors.white}
              imgSrc={AppIcons.Message}
              imgSize={20}
              buttonStyles={{ padding: "2px" }}
              onClick={onChat}
            />
          ) : (
            <>
              <PrimaryButton
                bgColor={appColors.white}
                imgSrc={AppIcons.Call}
                imgSize={20}
                buttonStyles={{ padding: "2px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAudioCall();
                }}
              />

              <PrimaryButton
                bgColor={appColors.white}
                imgSrc={AppIcons.Video}
                imgSize={20}
                buttonStyles={{ padding: "2px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onVideoCall();
                }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RecommendedCard;
