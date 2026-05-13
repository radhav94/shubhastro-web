import React from "react";
import styles from "./MoreHscope.module.scss";
import { PrimaryText, Title } from "../../../../component";
import { GrFormNext } from "react-icons/gr";

const MoreHscope = () => {
  const horoscopes = [
    {
      title: "Career Horoscope",
      href: "/horoscope/career",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Career_Horoscope_75a4a5bd9d.svg",
    },
    {
      title: "Love Horoscope",
      href: "/horoscope/love",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Love_Horoscope_bacfa32d03.svg",
    },
    {
      title: "Finance Horoscope",
      href: "/horoscope/finance",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Finance_Horoscope_bcc6c0bb67.svg",
    },
    {
      title: "Health Horoscope",
      href: "/horoscope/health",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Health_Horoscope_7707e9f6d3.svg",
    },
    {
      title: "Horoscope",
      href: "/horoscope",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Daily_Horoscope_3c3af383a0.svg",
    },
  ];

  return (
    <>
      <Title title="More Horoscopes for You" showDivider />

      <div className={styles.interest_flex}>
        {horoscopes.map((item, index) => (
          <InterestCard key={index} {...item} />
        ))}
      </div>

      <HoroTimmingList />
    </>
  );
};

export default MoreHscope;

const InterestCard = ({ title, href, imgSrc }) => {
  return (
    <div className={styles.interest_flex_box}>
      <a href={href}>
        <div className={styles.interest_cls}>
          <img
            loading="lazy"
            className={styles.interest_img}
            title={title}
            src={imgSrc}
            alt={title}
          />
        </div>
        <PrimaryText>{title}</PrimaryText>
      </a>
    </div>
  );
};

export const HoroTimmingList = () => {
  const data = [
    {
      title: "Yesterday",
      href: "/horoscope/yesterday",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Yesterday_38809916c3.svg",
    },
    {
      title: "Tomorrow",
      href: "/horoscope/tomorrow",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Tomorrow_5179efbcfe.svg",
    },
    {
      title: "Weekly",
      href: "/horoscope/weekly",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Weekly_d6934c5c5f.svg",
    },
    {
      title: "Monthly",
      href: "/horoscope/monthly",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Monthly_00cc39523b.svg",
    },
    {
      title: "Yearly",
      href: "/horoscope-2025",
      imgSrc:
        "https://images.astroyogi.com/strapicmsprod/assets/Yearly_b88d2b5eaf.svg",
    },
  ];
  return (
    <div className={styles.horoscopeBox}>
      <ul className={styles.horoSingList}>
        {data.map((item, index) => (
          <li key={index} className={styles.horoItem}>
            <div className={styles.homeLinkCls}>
              <img
                loading="lazy"
                title={item.title}
                src={item.imgSrc}
                alt={item.title}
              />
            </div>
            <PrimaryText size_14 isSemiBold>
              {item.title}
            </PrimaryText>

            <GrFormNext />
          </li>
        ))}
      </ul>
    </div>
  );
};
