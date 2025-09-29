import styles from "./Astrologers.module.scss";

import {
  AstrologerCard,
  Divider,
  PrimaryButton,
  PrimaryText,
} from "../../../../../component";
import { AppImages } from "../../../../../utils/appImages";

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

const Astrologers = ({ onChat }) => {
  return (
    <div className={styles.astrologersWrapper}>
      <div className={styles.header}>
        <PrimaryText isBold size_24 className={styles.headerTitle}>
          Top Online Astrologers
        </PrimaryText>
        <Divider responsive />
        <PrimaryButton width={"100px"} title="View" />
      </div>

      <div className={styles.cardsContainer}>
        {astrologersData.map((astrologer) => (
          <div key={astrologer.id} className={styles.cardWrapper}>
            <AstrologerCard
              data={astrologer}
              onChat={() => onChat(astrologer)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Astrologers;
