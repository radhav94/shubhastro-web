import styles from "./Astrologers.module.scss";

import {
  AstrologerCard,
  Divider,
  PrimaryButton,
  PrimaryText,
  Title,
} from "../../../../../component";
import { AppImages } from "../../../../../utils/appImages";
import { useGetAstrologersQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import { useState } from "react";

const astrologersData = [
  {
    AstrologerLoginId: 49671,
    FirstName: "Tarot",
    LastName: "Satvika",
    ExperienceYear: 4,
    ExperienceMonth: 0,
    ProfileImage: "tarot-satvika-7405159392822997.jpg",
    AstrologerType: null,
    Slug: "satvika",
    AstroCategoryNameDltd:
      "Tarot Reading, Reiki Healing, Yoga & Meditation, Pranic Healing, Meditation & Mindfulness, Fortune Telling, Love & Marriage Spell, Chakra Healing, Oracle Card Reading",
    PhoneCharge: {
      Value: 31.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 31.00",
      CommissionPercentage: 0.0,
    },
    ChatCharge: {
      Value: 31.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 31.00",
      CommissionPercentage: 0.0,
    },
    Currency: "INR",
    IsLiveCall: true,
    IsLiveChat: true,
    CityName: "New Delhi",
    LanguageDltd: "English, Hindi, Punjabi",
    IsOfferApplied: true,
    PhoneChargeDiscountPercentage: 12.0,
    OfferPhoneCharge: {
      Value: 12.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 12.00",
      CommissionPercentage: 0.0,
    },
    OfferChatCharge: {
      Value: 12.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 12.00",
      CommissionPercentage: 0.0,
    },
    OfferName: "FlatDeal&12",
    OfferFirstName: "FlatDeal",
    OfferLastName: "12",
    TileImage: "Campaign.png",
    AverageRating: 4.96,
    AstrologerAverageRating: {
      ValueDecimal: 4.96,
      ValueInt: 5,
      ValueStr: "4.96",
    },
    RatingCount: 3134,
    PhoneStatus: "Join Queue",
    ChatStatus: "Join Queue",
    IsAllowedQueue: true,
    IsAllowedChatQueue: true,
    IsHandleNriUser: false,
    IsPaidUser: false,
    IsExclusive: false,
    IsProvideFreeConsultation: false,
    NotifyMe: false,
    IsEveryTime: null,
    ResumeText: null,
    RowNum: 1,
    TotalRows: 1136,
  },

  {
    AstrologerLoginId: 48613,
    FirstName: "Tarot",
    LastName: "Dharra",
    ExperienceYear: 4,
    ExperienceMonth: 6,
    ProfileImage: "tarot-dharra-7690941669104289.jpg",
    AstrologerType: null,
    Slug: "dharra",
    AstroCategoryNameDltd: "Tarot Reading",
    PhoneCharge: {
      Value: 30.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 30.00",
      CommissionPercentage: 0.0,
    },
    ChatCharge: {
      Value: 30.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 30.00",
      CommissionPercentage: 0.0,
    },
    Currency: "INR",
    IsLiveCall: true,
    IsLiveChat: true,
    CityName: "Indore",
    LanguageDltd: "English, Hindi",
    IsOfferApplied: true,
    PhoneChargeDiscountPercentage: 12.0,
    OfferPhoneCharge: {
      Value: 12.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 12.00",
      CommissionPercentage: 0.0,
    },
    OfferChatCharge: {
      Value: 12.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 12.00",
      CommissionPercentage: 0.0,
    },
    OfferName: "FlatDeal&12",
    OfferFirstName: "FlatDeal",
    OfferLastName: "12",
    TileImage: "Campaign.png",
    AverageRating: 4.88,
    AstrologerAverageRating: {
      ValueDecimal: 4.88,
      ValueInt: 5,
      ValueStr: "4.88",
    },
    RatingCount: 412,
    PhoneStatus: "Online",
    ChatStatus: "Online",
    IsAllowedQueue: true,
    IsAllowedChatQueue: true,
    IsHandleNriUser: true,
    IsPaidUser: false,
    IsExclusive: false,
    IsProvideFreeConsultation: false,
    NotifyMe: false,
    IsEveryTime: null,
    ResumeText: null,
    RowNum: 3,
    TotalRows: 1136,
  },
  {
    AstrologerLoginId: 62458,
    FirstName: "Astro",
    LastName: "Manpreet",
    ExperienceYear: 6,
    ExperienceMonth: 0,
    ProfileImage: "astro-manpreet-7707605892123109.jpg",
    AstrologerType: null,
    Slug: "manpreet-a",
    AstroCategoryNameDltd: "Vedic Astrology, Western astrology",
    PhoneCharge: {
      Value: 30.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 30.00",
      CommissionPercentage: 0.0,
    },
    ChatCharge: {
      Value: 30.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 30.00",
      CommissionPercentage: 0.0,
    },
    Currency: "INR",
    IsLiveCall: true,
    IsLiveChat: true,
    CityName: "Jaunpur",
    LanguageDltd: "English, Hindi",
    IsOfferApplied: true,
    PhoneChargeDiscountPercentage: 12.0,
    OfferPhoneCharge: {
      Value: 12.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 12.00",
      CommissionPercentage: 0.0,
    },
    OfferChatCharge: {
      Value: 12.0,
      Currency: "INR",
      CurrencySign: "₹",
      ValueStr: "₹ 12.00",
      CommissionPercentage: 0.0,
    },
    OfferName: "Flat Deal&12",
    OfferFirstName: "Flat Deal",
    OfferLastName: "12",
    TileImage: "Campaign.png",
    AverageRating: 4.87,
    AstrologerAverageRating: {
      ValueDecimal: 4.87,
      ValueInt: 5,
      ValueStr: "4.87",
    },
    RatingCount: 356,
    PhoneStatus: "Online",
    ChatStatus: "Online",
    IsAllowedQueue: true,
    IsAllowedChatQueue: true,
    IsHandleNriUser: false,
    IsPaidUser: false,
    IsExclusive: false,
    IsProvideFreeConsultation: false,
    NotifyMe: false,
    IsEveryTime: null,
    ResumeText: null,
    RowNum: 4,
    TotalRows: 1136,
  },
];

const astroImages = [
  `https://images.astroyogi.com/english/astrologer/profileimage/astro-manpreet-7707605892123109.jpg`,
  `https://images.astroyogi.com/english/astrologer/profileimage/tarot-dharra-7690941669104289.jpg`,
  `https://images.astroyogi.com/english/astrologer/profileimage/tarot-satvika-7405159392822997.jpg`,
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/19191028/Leo-Daily-Horoscope-Today.jpg", // astrology chart
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/20121804/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-10-768x512.jpg", // zodiac wheel
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/18190254/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-3-768x512.jpg", // planets galaxy
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/16143512/Blog-Banner-for-Website-Content-1280-x-853-px-9-768x512.jpg", // constellation
];

const Astrologers = ({ onChat, onClickView, onProfile }) => {
  const page = 1;
  const limit = 6;

  const { data } = useGetAstrologersQuery({ page, limit });
  return (
    <div className={styles.astrologersWrapper}>
      <Title
        title="Top Online Astrologers"
        showDivider
        showButton
        buttonTitle="View"
        onButtonClick={onClickView}
      />

      <div className={styles.cardsContainer}>
        {data?.data?.slice(0, 3).map((astrologer, index) => (
          <div key={astrologer._id} className={styles.cardWrapper}>
            <AstrologerCard
              image={astroImages[index % astroImages.length]}
              data={astrologer}
              onChat={() => onChat(astrologer)}
              onProfile={() => onProfile(astrologer)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Astrologers;
