import styles from "./AstrologersCard.module.scss";
import PrimaryText from "../../PrimaryText";
import PrimaryButton from "../../PrimaryButton";
import { appColors } from "../../../utils/theme";
import { AppIcons, AppImages } from "../../../utils/appImages";
import Divider from "../../Divider";
import { MdOutlineCurrencyRupee } from "react-icons/md";
import { GetString } from "../../../utils/helper/string.utils";
import { Link } from "react-router-dom";

// AstrologerCard.jsx
const AstrologerCard = ({
  data,
  onFollow,
  onChat,
  onProfile,
  onAudioCall,
  onVideoCall,
  isLayoutClassic=true
}) => {
  return (
    <div className={styles.card}>
      <div className={!isLayoutClassic? styles.topSection1 : styles.topSection} onClick={onProfile}>
        <div className={!isLayoutClassic ? styles.avatarWrapper1 : styles.avatarWrapper}>
          <Link to={`/astrologer/${data?._id}`}>        
            <img
              src={data.imageUrl}
              alt={data?.firstName}
              className={styles.avatar}
            />
            <span
              className={`${styles.statusDot} ${
                data.isAccountActive === true
                  ? styles.online
                  : data.status === false
                  ? styles.offline
                  : styles.busy
              }`}
            />
          </Link>
        </div>

        <div className={styles.info}>
          <div className={styles.infoHeader}>
            <Link to={`/astrologer/${data?._id}`}>
              <PrimaryText size_14 isExtraBold color={appColors.tri}>
                {data?.firstName} {data?.lastName}
              </PrimaryText>
            </Link>
          </div>

          {data?.languagePreference?.length > 0 && isLayoutClassic && (
            <div className={styles.row}>
              <img src={AppIcons.Lang} alt="lang" className={styles.img} />
              <PrimaryText size_12 isSemiBold color={appColors.greyMedium}>
                {data?.languagePreference?.join(",")}
              </PrimaryText>
            </div>
          )}

          {isLayoutClassic && <div className={styles.row}>
            <img src={AppIcons.Education} alt="lang" className={styles.img} />
            <PrimaryText size_12 isBold color={appColors.greyMedium}>
              {data.experience} Years
            </PrimaryText>
          </div>}

          <div className={styles.starCard}>
            <div className={styles.row} style={{ margin: "0px" }}>
              <img src={AppIcons.Trophy} alt="lang" className={styles.img} />
              <PrimaryText size_12 color={appColors.greyMedium}>
                {data?.specialties?.length > 0
                  ? GetString(data?.specialties?.join(", "), 30)
                  : data.role}
              </PrimaryText>
            </div>
          </div>
        </div>
      </div>

      <Divider responsive margin="0px" />

      <div className={styles.bottomRow}>
        <div className={styles.buttonsRow}>
          <PrimaryButton
            bgColor={appColors.white}
            imgSrc={AppIcons.Message}
            fontSize={12}
            buttonStyles={{ padding: "4px 6px" }}
            title="Chat"
            onClick={onChat}
          />
          <PrimaryButton
            bgColor={appColors.white}
            imgSrc={AppIcons.Call}
            fontSize={12}
            buttonStyles={{ padding: "4px 6px" }}
            title="Voice Call"
            onClick={onAudioCall}
          />
          <PrimaryButton
            bgColor={appColors.white}
            imgSrc={AppIcons.Video}
            fontSize={12}
            buttonStyles={{ padding: "4px 6px" }}
            title="Video Call"
            onClick={onVideoCall}
          />
        </div>
      </div>
    </div>
  );
};

export default AstrologerCard;
