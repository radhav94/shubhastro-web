import React from "react";
import styles from "./HoroScopeBanner.module.scss";
import PrimaryText from "../../../../component/PrimaryText";

const zodiacSigns = [
  {
    name: "Aries",
    date: "21/3-19/4",
    img: "https://images.astroyogi.com/strapicmsprod/assets/ARIES_04bdeca59e.svg",
    link: "/horoscopes/daily/aries-free-horoscope.aspx",
  },
  {
    name: "Taurus",
    date: "20/4-20/5",
    img: "https://images.astroyogi.com/strapicmsprod/assets/TAURUS_198b4c97e9.svg",
    link: "/horoscopes/daily/taurus-free-horoscope.aspx",
  },
  {
    name: "Gemini",
    date: "21/5-20/6",
    img: "https://images.astroyogi.com/strapicmsprod/assets/GEMINI_9d35540bb9.svg",
    link: "/horoscopes/daily/gemini-free-horoscope.aspx",
  },
  {
    name: "Cancer",
    date: "21/6-22/7",
    img: "https://images.astroyogi.com/strapicmsprod/assets/CANCER_364708b894.svg",
    link: "/horoscopes/daily/cancer-free-horoscope.aspx",
  },
  {
    name: "Leo",
    date: "23/7-22/8",
    img: "https://images.astroyogi.com/strapicmsprod/assets/LEO_593adbf0e7.svg",
    link: "/horoscopes/daily/leo-free-horoscope.aspx",
  },
  {
    name: "Virgo",
    date: "23/8-22/9",
    img: "https://images.astroyogi.com/strapicmsprod/assets/VIRGO_fb766f0d08.svg",
    link: "/horoscopes/daily/virgo-free-horoscope.aspx",
  },
  {
    name: "Libra",
    date: "23/9-22/10",
    img: "https://images.astroyogi.com/strapicmsprod/assets/LIBRA_c60a49cefb.svg",
    link: "/horoscopes/daily/libra-free-horoscope.aspx",
  },
  {
    name: "Scorpio",
    date: "23/10-21/11",
    img: "https://images.astroyogi.com/strapicmsprod/assets/SCORPIO_e6bde48051.svg",
    link: "/horoscopes/daily/scorpio-free-horoscope.aspx",
  },
  {
    name: "Sagittarius",
    date: "22/11-21/12",
    img: "https://images.astroyogi.com/strapicmsprod/assets/SAGITTARIUS_e0ed1cd1fd.svg",
    link: "/horoscopes/daily/sagittarius-free-horoscope.aspx",
  },
  {
    name: "Capricorn",
    date: "22/12-19/1",
    img: "https://images.astroyogi.com/strapicmsprod/assets/CAPRICORN_ab2706bf23.svg",
    link: "/horoscopes/daily/capricorn-free-horoscope.aspx",
  },
  {
    name: "Aquarius",
    date: "20/1-18/2",
    img: "https://images.astroyogi.com/strapicmsprod/assets/AQUARIUS_4ad6eab3c3.svg",
    link: "/horoscopes/daily/aquarius-free-horoscope.aspx",
  },
  {
    name: "Pisces",
    date: "19/2-20/3",
    img: "https://images.astroyogi.com/strapicmsprod/assets/PISCES_4991a00d62.svg",
    link: "/horoscopes/daily/pisces-free-horoscope.aspx",
  },
];

const HoroScopeBanner = () => {
  return (
    <div className={styles.zodiacHeader}>
      <div className={styles.zodiacLeft}>
        <div className={styles.zodiacCls}>
          <img
            className={styles.zodiacMain}
            src="https://images.astroyogi.com/strapicmsprod/assets/horoscopes_e87a82bf53.webp"
            alt="daily horoscope"
            title="Horoscope"
          />
        </div>
        <h1>Horoscope</h1>
        <p>
          Get free horoscope predictions for all zodiac signs. Explore horoscope
          dates, check your daily horoscope, and discover what your zodiac sign
          means. Uncover your destiny today!
        </p>
      </div>

      <div className={styles.zodiacRight}>
        <div className={styles.rashisContainer}>
          {zodiacSigns.map((e) => (
            <div key={e.id} className={styles.card}>
              <div>
                <img src={e.img} alt={e.name} />
              </div>
              <PrimaryText>{e.name}</PrimaryText>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HoroScopeBanner;
