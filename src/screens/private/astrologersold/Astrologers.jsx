import React from "react";
import styles from "./Astrologers.module.scss";
import { Star, Phone, MessageCircle, Gift } from "lucide-react";
import { PrimaryButton, PrimaryText } from "../../../component";
import { appColors } from "../../../utils/theme";
import { AppIcons, AppImages } from "../../../utils/appImages";
import { GetString } from "../../../utils/helper/string.utils";
import { useLocation } from "react-router-dom";

const Astrologers = () => {
  const location = useLocation();
  const data = location.state?.data;

  const phoneCharge = data?.IsOfferApplied
    ? data.PhoneCharge.Value - data.OfferPhoneCharge.Value
    : data.PhoneCharge.Value;

  // return (
  //   <div className={styles.container}>
  //     <div className={styles.left}>
  //       <ProfileCard data={data} />
  //       <GiftCard />
  //       <AboutCard />
  //     </div>
  //     <div className={styles.right}>
  //       <PriceCard
  //         phoneChargeStr={phoneCharge}
  //         price={data.Price}
  //         oldPrice={data.OldPrice}
  //         deal={data.Deal}
  //         data={data}
  //       />
  //       <RatingsCard
  //         rating={data.AverageRating}
  //         ratingCount={data.RatingCount}
  //       />
  //       <BadgesCard />
  //     </div>
  //   </div>
  // );
};

/* ProfileCard */
const ProfileCard = ({ data }) => (
  <div className={`${styles.topSection} ${styles.profileCard}`}>
    <div className={styles.avatarWrapper}>
      <img
        src={`https://images.astroyogi.com/english/astrologer/profileimage/${data.ProfileImage}`}
        alt={data.FirstName}
        className={styles.avatar}
      />
      <span className={`${styles.statusDot} ${styles.online}`} />
    </div>

    <div className={styles.info}>
      <div className={styles.infoHeader}>
        <PrimaryText size_16 isExtraBold color={appColors.tri}>
          {data.FirstName} {data.LastName}
        </PrimaryText>
        <PrimaryButton
          borderColor={!data.NotifyMe ? appColors.pri : appColors.tri}
          fontSize={12}
          transparent
          buttonStyles={{ padding: "4px 12px" }}
          title={!data.NotifyMe ? "Follow" : "UnFollow"}
        />
      </div>

      <div className={styles.row}>
        <img src={AppIcons.Lang} alt="lang" className={styles.img} />
        <PrimaryText size_12 isSemiBold color={appColors.greyMedium}>
          {data.LanguageDltd}
        </PrimaryText>
      </div>

      <div className={styles.row}>
        <img src={AppIcons.Education} alt="lang" className={styles.img} />
        <PrimaryText size_12 isBold color={appColors.greyMedium}>
          {data.ExperienceYear} Years
        </PrimaryText>
      </div>

      <div className={styles.starCard}>
        <div className={styles.row} style={{ margin: "0px" }}>
          <img src={AppIcons.Trophy} alt="lang" className={styles.img} />
          <PrimaryText size_12 color={appColors.greyMedium}>
            {GetString(data.AstroCategoryNameDltd, 20)}
          </PrimaryText>
        </div>

        <div className={styles.rowCard}>
          <img src={AppIcons.Star} alt="lang" className={styles.img} />
          <PrimaryText size_12>{data.AverageRating}</PrimaryText>
          <PrimaryText size_12> | {data.RatingCount}</PrimaryText>
        </div>
      </div>
    </div>
  </div>
);

/* GiftCard */
const GiftCard = () => (
  <div className={`${styles.giftCard} ${styles.profileCard}`}>
    <div className={styles.giftHeader}>
      <PrimaryText>Send Gifts</PrimaryText>
      <PrimaryButton width={180} fontSize={14} className="p-4" title="Gift" />
    </div>
  </div>
);

/* AboutCard */
const AboutCard = () => (
  <div className={`${styles.aboutCard} ${styles.profileCard}`}>
    <PrimaryText size_18>About</PrimaryText>
    <PrimaryText className="pt-4">
      I am a renowned astrologer known for accurately predicting Kundli charts
      based on Gochar, transit, and Dasha. I have received numerous accolades
      and recognitions during my more than ten years of astrological practice. I
      can forecast major life events such as education, job or promotion
      prospects, business success, marital relations, family, matchmaking, love
      life, and so on. I am also proficient in financial market forecasting and
      Vastu Shastra. Most clients are pleased with my services because of my
      precise and accurate predictions. I've helped thousands of people solve
      their problems and get on the right track to success. I believe in helping
      others with all of my heart and to the best of my ability, and I strive to
      provide my clients with simple and easy solutions and remedies. I advise
      my customers never to give up hope and that even in their darkest and most
      trying moments, they will find happiness because I firmly believe that a
      higher power is constantly watching over them.
    </PrimaryText>
  </div>
);

/* PriceCard */
const PriceCard = ({ price, oldPrice, deal, phoneChargeStr, data }) => (
  <div className={`${styles.priceCard} ${styles.profileCard}`}>
    <p className={styles.price}>
      ₹ {phoneChargeStr}/Min
      <span className={styles.strike}>{data.PhoneCharge.ValueStr}/Min</span>
    </p>
    <PrimaryText size_12 color={appColors.tri} isBold>
      {deal}
    </PrimaryText>
    <div className={styles.actions}>
      <div className="flex justify-between">
        <PrimaryButton transparent width={"100%"} title="Chat" />
        <div className="px-12" />
        <PrimaryButton width={"100%"} title="Call" />
      </div>
      <button className={`${styles.btn} ${styles.bookBtn}`}>
        BOOK SESSION
      </button>
    </div>
  </div>
);

/* RatingsCard */
const RatingsCard = ({ rating, ratingCount }) => (
  <div className={`${styles.ratingsCard} ${styles.profileCard}`}>
    <h3>Ratings</h3>
    <div className={styles.ratingValue}>
      <span>{rating}</span> <Star className={styles.starBig} />{" "}
      <small>({ratingCount} ratings)</small>
    </div>
    <div className={styles.ratingBars}>
      {[5, 4, 3, 2, 1].map((num) => (
        <div className={styles.bar} key={num}>
          <span>{num} ★</span>
          <div
            className={styles.progress}
            style={{ "--progress-width": `${num * 20}%` }}
          />
        </div>
      ))}
    </div>
  </div>
);

/* BadgesCard */
const BadgesCard = () => (
  <div className={`${styles.badgesCard} ${styles.profileCard}`}>
    <PrimaryText>💰 Money Back Guarantee</PrimaryText>
    <PrimaryText>✔️ Verified Expert Astrologers</PrimaryText>
    <PrimaryText>🔒 100% Secure Payments</PrimaryText>
  </div>
);

export default Astrologers;
