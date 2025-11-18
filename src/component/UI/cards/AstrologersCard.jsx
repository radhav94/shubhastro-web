import styles from "./AstrologersCard.module.scss";
import PrimaryText from "../../PrimaryText";
import PrimaryButton from "../../PrimaryButton";
import { appColors } from "../../../utils/theme";
import { AppIcons, AppImages } from "../../../utils/appImages";
import Divider from "../../Divider";
import { MdOutlineCurrencyRupee } from "react-icons/md";
import { GetString } from "../../../utils/helper/string.utils";

const AstrologerCard = ({ data, onFollow, onChat, onProfile, image = "" }) => {
  return (
    <div className={styles.card}>
      <div className={styles.topSection} onClick={onProfile}>
        <div className={styles.avatarWrapper}>
          <img
            src={data.imageUrl}
            // src={image}
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
        </div>

        <div className={styles.info}>
          <div className={styles.infoHeader}>
            <PrimaryText size_14 isExtraBold color={appColors.tri}>
              {data?.firstName} {data?.lastName}
            </PrimaryText>
            {/* <PrimaryButton
              onClick={onFollow}
              borderColor={!data.NotifyMe ? appColors.pri : appColors.tri}
              fontSize={12}
              transparent
              buttonStyles={{ padding: "4px 12px" }}
              title={!data.NotifyMe ? "Follow" : "UnFollow"}
            /> */}
          </div>

          {data?.languagePreference?.length > 0 && (
            <div className={styles.row}>
              <img src={AppIcons.Lang} alt="lang" className={styles.img} />
              <PrimaryText size_12 isSemiBold color={appColors.greyMedium}>
                {data?.languagePreference?.join(",")}
              </PrimaryText>
            </div>
          )}

          <div className={styles.row}>
            <img src={AppIcons.Education} alt="lang" className={styles.img} />
            <PrimaryText size_12 isBold color={appColors.greyMedium}>
              {data.experience} Years
            </PrimaryText>
          </div>

          <div className={styles.starCard}>
            <div className={styles.row} style={{ margin: "0px" }}>
              <img src={AppIcons.Trophy} alt="lang" className={styles.img} />
              <PrimaryText size_12 color={appColors.greyMedium}>
                {data?.specialties?.length > 0
                  ? GetString(data?.specialties?.join(), 20)
                  : data.role}
              </PrimaryText>
            </div>

            {/* <div className={styles.rowCard}>
              <img
                src={AppIcons.Star}
                alt="lang"
                className={styles.img}
                style={{ height: 16, width: 16 }}
              />
              <PrimaryText size_12>{data.AverageRating}</PrimaryText>
              <PrimaryText size_12> | {data.RatingCount}</PrimaryText>
            </div> */}
          </div>
        </div>
      </div>

      <Divider responsive margin="0px" />

      <div className={styles.bottomRow}>
        {/* <div className={styles.priceRow}>
          <MdOutlineCurrencyRupee color={appColors.black} size={12} />
          <PrimaryText className=" pr-1" size_12>
            {data?.PhoneCharge?.Value}/Min
          </PrimaryText>
          <MdOutlineCurrencyRupee color={appColors.black} size={12} />
          <PrimaryText
            className=" line-through"
            color={appColors.greyDark}
            size_12
          >
            {data?.OfferChatCharge?.Value} off
          </PrimaryText>
        </div> */}

        <div className={styles.buttonsRow}>
          {/* <PrimaryButton
            bgColor={appColors.white}
            imgSrc={AppIcons.Message}
            fontSize={12}
            buttonStyles={{ padding: "4px 6px" }}
            title="Chat"
            onClick={onChat}
          /> */}
          {/* <PrimaryButton
            bgColor={appColors.white}
            imgSrc={AppIcons.Call}
            fontSize={12}
            buttonStyles={{ padding: "4px 6px" }}
            title="Call"
          /> */}
        </div>
      </div>
    </div>
  );
};

export default AstrologerCard;
