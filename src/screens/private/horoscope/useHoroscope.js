import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const useHoroscope = () => {
  const navigate = useNavigate();
  let defaultImg =
    "https://images.astroyogi.com/strapicmsprod/assets/horoscopes_e87a82bf53.webp";
  const data = {
    leftimg:
      "https://images.astroyogi.com/strapicmsprod/assets/horoscopes_e87a82bf53.webp",
    header: "Horoscope",
    description:
      "Get free horoscope predictions for all zodiac signs. Explore horoscope dates, check your daily horoscope, and discover what your zodiac sign means. Uncover your destiny today!",

    zodiacSigns: [
      {
        id: 1,
        name: "Aries",
        date: "21/3-19/4",
        img: "https://images.astroyogi.com/strapicmsprod/assets/ARIES_04bdeca59e.svg",
        bannerImg:
          "https://images.astroyogi.com/strapicmsprod/assets/Traits_ee14f625a9.webp",
        link: "/horoscope/daily/aries-free-horoscope.aspx",
        description:
          "Aries are energetic, courageous, and ambitious leaders who love new challenges.",
      },
      {
        id: 2,
        name: "Taurus",
        date: "20/4-20/5",
        img: "https://images.astroyogi.com/strapicmsprod/assets/TAURUS_198b4c97e9.svg",
        bannerImg:
          "https://images.astroyogi.com/strapicmsprod/assets/Seasons_b0619d2142.webp",
        link: "/horoscope/daily/taurus-free-horoscope.aspx",
        description:
          "Taurus is patient, reliable, and loves beauty and comfort, valuing stability above all.",
      },
      {
        id: 3,
        name: "Gemini",
        date: "21/5-20/6",
        img: "https://images.astroyogi.com/strapicmsprod/assets/GEMINI_9d35540bb9.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/gemini-free-horoscope.aspx",
        description:
          "Gemini are adaptable, curious, and expressive communicators who thrive on variety.",
      },
      {
        id: 4,
        name: "Cancer",
        date: "21/6-22/7",
        img: "https://images.astroyogi.com/strapicmsprod/assets/CANCER_364708b894.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/cancer-free-horoscope.aspx",
        description:
          "Cancer is nurturing, intuitive, and deeply emotional, valuing home and family.",
      },
      {
        id: 5,
        name: "Leo",
        date: "23/7-22/8",
        img: "https://images.astroyogi.com/strapicmsprod/assets/LEO_593adbf0e7.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/leo-free-horoscope.aspx",
        description:
          "Leo is confident, charismatic, and loves to be in the spotlight, leading with pride.",
      },
      {
        id: 6,
        name: "Virgo",
        date: "23/8-22/9",
        img: "https://images.astroyogi.com/strapicmsprod/assets/VIRGO_fb766f0d08.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/virgo-free-horoscope.aspx",
        description:
          "Virgo is analytical, practical, and detail-oriented, with a deep love for service.",
      },
      {
        id: 7,
        name: "Libra",
        date: "23/9-22/10",
        img: "https://images.astroyogi.com/strapicmsprod/assets/LIBRA_c60a49cefb.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/libra-free-horoscope.aspx",
        description:
          "Libra is charming, balanced, and values harmony and fairness in all relationships.",
      },
      {
        id: 8,
        name: "Scorpio",
        date: "23/10-21/11",
        img: "https://images.astroyogi.com/strapicmsprod/assets/SCORPIO_e6bde48051.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/scorpio-free-horoscope.aspx",
        description:
          "Scorpio is passionate, intense, and deeply intuitive, often driven by transformation.",
      },
      {
        id: 9,
        name: "Sagittarius",
        date: "22/11-21/12",
        img: "https://images.astroyogi.com/strapicmsprod/assets/SAGITTARIUS_e0ed1cd1fd.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/sagittarius-free-horoscope.aspx",
        description:
          "Sagittarius is adventurous, optimistic, and loves freedom, always seeking knowledge.",
      },
      {
        id: 10,
        name: "Capricorn",
        date: "22/12-19/1",
        img: "https://images.astroyogi.com/strapicmsprod/assets/CAPRICORN_ab2706bf23.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/capricorn-free-horoscope.aspx",
        description:
          "Capricorn is disciplined, ambitious, and practical, with a strong sense of responsibility.",
      },
      {
        id: 11,
        name: "Aquarius",
        date: "20/1-18/2",
        img: "https://images.astroyogi.com/strapicmsprod/assets/AQUARIUS_4ad6eab3c3.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/aquarius-free-horoscope.aspx",
        description:
          "Aquarius is innovative, independent, and humanitarian, always thinking of the future.",
      },
      {
        id: 12,
        name: "Pisces",
        date: "19/2-20/3",
        img: "https://images.astroyogi.com/strapicmsprod/assets/PISCES_4991a00d62.svg",
        bannerImg: defaultImg,
        link: "/horoscope/daily/pisces-free-horoscope.aspx",
        description:
          "Pisces is empathetic, dreamy, and intuitive, guided strongly by emotions and imagination.",
      },
    ],
  };
  let description =
    "Excitement will be at its peak and so will be the fear of the unknown and the unseen with Moon settling in Pisces. The power of the subconscious mind is unique and exerts a great deal of force on what may happen. So, if you are frightened that something undesirable might take place, chances are that it will definitely take place today. There is a reason why spiritual gurus all over the world advise us to think positive.Do not let negative thoughts rule you and inadvertently compel you to do something undesirable. There is every possibility that you will find a sudden change in your behavior. Those who are usually very calm and poised will be prone to temper tantrums and behave rather rudely. Shocking or not, this may land you in the soup. Don’t do anything that can tarnish your reputation or affect your relationships, avoid new endeavors and entering partnerships and yes, think positive. With Moon in Pisces, you will experience positive things happening in your professional life. A business related trip maybe on the cards too, this should be fun.";
  let horoDisc =
    "A horoscope is an astrological chart created based on the positions of the Sun, Moon, and other celestial bodies at the time of a person's birth. It provides insights into an individual's personality, likes, dislikes, thoughts, love life, career, health, and more. Horoscopes offer a glimpse into future events and can be used to make informed decisions.Horoscopic traditions are primarily associated with the Western Zodiac. Vedic Astrology, on the other hand, uses a different system with the Kundali (birth chart). While some debate the scientific validity of horoscopes, their accuracy in reflecting individual traits continues to intrigue many.";

  const onClickSign = (data) => {
    navigate(`/horoscope/daily/${data.name}-free-horoscope`, {
      state: { data },
    });
  };

  const onChat = (data) => {
    navigate(`/astrologer/expert/${data.FirstName}`, {
      state: { data: data },
    });
  };

  return [description, horoDisc, onChat, onClickSign, data];
};
