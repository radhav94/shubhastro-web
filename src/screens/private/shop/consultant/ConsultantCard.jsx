import { useNavigate } from "react-router-dom";
import { Divider, PrimaryText } from "../../../../component";
import { AppIcons, DefaultImages } from "../../../../utils/appImages";
import { GetString } from "../../../../utils/helper/string.utils";
import { appColors } from "../../../../utils/theme";
import styles from "./ConsultantCard.module.scss";

// ConsultantCard.jsx
const ConsultantCard = ({ data }) => {
  const navigate = useNavigate();
  const handleSelect = () => {
    navigate("/consultant/payment", {
      state: {
        data,
      },
    });
  };
  return (
    <div className={styles.card}>
      <div
        className={styles.topSection}
        //   onClick={onProfile}
      >
        <div className={styles.avatarWrapper}>
          <img
            src={data?.imageUrl || DefaultImages.AstrologerNumerologyDefault}
            alt={data?.firstName}
            className={styles.avatar}
          />
          <span
            className={`${styles.statusDot} ${
              data?.isAccountActive === true
                ? styles.online
                : data?.status === false
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
              {data?.experience} Years
            </PrimaryText>
          </div>
        </div>
        <button className={styles.select} onClick={handleSelect}>
          select
        </button>
      </div>

      {/* <Divider responsive margin="0px" /> */}

      <div className={styles.bottomRow}></div>
    </div>
  );
};

export default ConsultantCard;
