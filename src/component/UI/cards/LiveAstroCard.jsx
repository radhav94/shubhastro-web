import React from "react";
import { AppImages } from "../../../utils/appImages";
import PrimaryText from "../../PrimaryText";
import styles from "./LiveAstroCard.module.scss";
import PrimaryButton from "../../PrimaryButton";
import { GrFormNext } from "react-icons/gr";
import { GetString } from "../../../utils/helper/string.utils";
import { appColors } from "../../../utils/theme";
import toast from "../../toast";

const LiveAstroCard = ({ data, onWatchNow, upComing }) => {
  // Construct display values directly from API data
  const name = `${data.FirstName} ${data.LastName}`;

  const category = data.AstroCategoryNameDltd;
  const status = data.IsLiveCall ? "live" : "offline";
  const getRandomFutureDate = () => {
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 7) + 1; // 1–7 days in future
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + randomDays);

    // Format: "05 Oct, 3:30 PM"
    return futureDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      className={styles.card}
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.52), rgba(0,0,0,0.52)), url(${AppImages.BgAstro})`,
      }}
    >
      {/* Status Badge */}
      <span
        className={`${styles.statusDot} ${
          status === "live"
            ? styles.live
            : status === "offline"
            ? styles.offline
            : styles.busy
        }`}
      >
        {status}
      </span>

      {/* Top Section */}
      <div className={styles.topSection}>
        <div className={styles.avatarWrapper}>
          <img
            src={`https://images.astroyogi.com/english/astrologer/profileimage/${data.ProfileImage}`}
            alt={name}
            className={styles.avatar}
          />
        </div>

        <div className={styles.info}>
          <PrimaryText size_12 isExtraBold isCenter isWhite>
            {name}
          </PrimaryText>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <PrimaryButton
              fontSize={12}
              bgColor={"#8CC4EB"}
              buttonStyles={{ padding: "2px 8px" }}
              title="+ Follow"
            />
          </div>

          <PrimaryText size_14 isSemiBold isWhite isCenter lines={1}>
            {category}
          </PrimaryText>
        </div>
      </div>

      {upComing ? (
        <div
          className={styles.watchNowWrapper}
          onClick={() =>
            toast.success(
              "Your session is about to go live. Thanks for waiting!"
            )
          }
          style={{ flexDirection: "column", backgroundColor: appColors.btn }}
        >
          <PrimaryText size_12 isBold isWhite isCenter>
            Up Coming Seesion
          </PrimaryText>

          <PrimaryText size_12>{getRandomFutureDate()}</PrimaryText>
        </div>
      ) : (
        <div
          className={styles.watchNowWrapper}
          onClick={() => onWatchNow(data)}
        >
          <PrimaryText size_12 isBold isWhite isCenter>
            Watch Now
          </PrimaryText>
          <GrFormNext color="#fff" />
        </div>
      )}
    </div>
  );
};

export default LiveAstroCard;
