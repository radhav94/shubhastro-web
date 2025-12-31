import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { appSvgs } from "../../../utils/appImages";

const {
  Aries,
  Taurus,
  Gemini,
  Cancer,
  Leo,
  Virgo,
  Libra,
  Scorpio,
  Sagittarius,
  Capricorn,
  Aquarius,
  Pisces,
} = appSvgs;

export const zodiac = () => {
  const navigate = useNavigate();
  let defaultImg =
    "https://images.astroyogi.com/strapicmsprod/assets/horoscopes_e87a82bf53.webp";
  const data = {
    leftimg:
      "https://images.astroyogi.com/strapicmsprod/assets/horoscopes_e87a82bf53.webp",
    header: "Horoscope",
    description:
      "Get free horoscope predictions for all zodiac signs. Explore horoscope ranges, check your daily horoscope, and discover what your zodiac sign means. Uncover your destiny today!",

    signs: [
      {
        id: 1,
        name: "Aries",
        range: "Mar 21 - Apr 19",
        img: Aries,
        bannerImg:
          "https://images.astroyogi.com/strapicmsprod/assets/Traits_ee14f625a9.webp",
        link: "/horoscopes/daily/aries-free-horoscope.aspx",
        overview:
          "Fiery Mars-ruled Aries, your pioneering spirit ignites transformation today. As the first sign of the zodiac, you naturally lead with courage and determination. Your cardinal fire energy seeks new beginnings and bold adventures in all endeavors.",
      },
      {
        id: 2,
        name: "Taurus",
        range: "Apr 20 - May 20",
        img: Taurus,
        bannerImg:
          "https://images.astroyogi.com/strapicmsprod/assets/Seasons_b0619d2142.webp",
        link: "/horoscopes/daily/taurus-free-horoscope.aspx",
        overview:
          "Grounded Taurus, ruled by Venus, embodies earthly stability and sensual appreciation. Your fixed earth nature seeks comfort, beauty, and lasting value in all endeavors, making you a reliable foundation for others.",
      },
      {
        id: 3,
        name: "Gemini",
        range: "May 21 - Jun 20",
        img: Gemini,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/gemini-free-horoscope.aspx",
        overview:
          "Gemini, ruled by Mercury, your dual nature thrives on intellectual stimulation and social connection. As an air sign, you naturally adapt to changing circumstances while maintaining your curious, communicative essence that bridges different worlds and perspectives.",
      },
      {
        id: 4,
        name: "Cancer",
        range: "Jun 21 - Jul 22",
        img: Cancer,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/cancer-free-horoscope.aspx",
        overview:
          "Cancer, the nurturing water sign ruled by the Moon, embodies emotional depth and protective instincts. Your intuitive nature and caring heart guide you through life's rhythms with sensitivity and wisdom.",
      },
      {
        id: 5,
        name: "Leo",
        range: "Jul 23 - Aug 22",
        img: Leo,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/leo-free-horoscope.aspx",
        overview:
          "Bold Leo, ruled by the radiant Sun, your natural magnetism and creative fire illuminate every space you enter. Today's Tuesday energy, governed by Mars, amplifies your already powerful presence with dynamic action-oriented vibrations that demand leadership.",
      },
      {
        id: 6,
        name: "Virgo",
        range: "Aug 23 - Sep 22",
        img: Virgo,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/virgo-free-horoscope.aspx",
        overview:
          "Virgo, ruled by Mercury, embodies analytical precision and practical wisdom. Your earth sign nature seeks perfection through methodical approaches and meticulous attention to detail. Today's Monday energy, guided by the Moon, invites you to blend your analytical mind with intuitive insights for optimal results.",
      },
      {
        id: 7,
        name: "Libra",
        range: "Sep 23 - Oct 22",
        img: Libra,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/libra-free-horoscope.aspx",
        overview:
          "Libra, ruled by Venus and symbolized by the scales, you embody harmony, beauty, and diplomatic grace. Your air sign nature seeks balance in all relationships, while your aesthetic sensibility draws you toward elegance and fairness in every interaction.",
      },
      {
        id: 8,
        name: "Scorpio",
        range: "Oct 23 - Nov 21",
        img: Scorpio,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/scorpio-free-horoscope.aspx",
        overview:
          "Scorpio, ruled by transformative Pluto and fierce Mars, embodies profound emotional depth and magnetic intensity. Your fixed water nature creates unshakeable determination while your investigative spirit uncovers hidden truths beneath surface appearances.",
      },
      {
        id: 9,
        name: "Sagittarius",
        range: "Nov 22 - Dec 21",
        img: Sagittarius,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/sagittarius-free-horoscope.aspx",
        overview:
          "As the archer of the zodiac, Sagittarius embodies boundless curiosity and philosophical wisdom. Ruled by expansive Jupiter, your fire sign nature seeks truth, adventure, and higher learning. Your optimistic spirit and love for freedom define your cosmic journey through life's grand adventures.",
      },
      {
        id: 10,
        name: "Capricorn",
        range: "Dec 22 - Jan 19",
        img: Capricorn,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/capricorn-free-horoscope.aspx",
        overview:
          "Capricorn, ruled by disciplined Saturn, your earth element brings methodical strength and unwavering determination. Today's Tuesday Mars energy amplifies your natural leadership abilities, creating perfect conditions for ambitious pursuits and structured progress toward your mountain-top goals.",
      },
      {
        id: 11,
        name: "Aquarius",
        range: "Jan 20 - Feb 18",
        img: Aquarius,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/aquarius-free-horoscope.aspx",
        overview:
          "Aquarius, the water bearer ruled by progressive Uranus, emerges as Tuesday's Martian energy amplifies your revolutionary spirit. Your fixed air nature harmonizes with November's transformative currents, igniting breakthroughs in humanitarian pursuits and technological frontiers.",
      },
      {
        id: 12,
        name: "Pisces",
        range: "Feb 19 - Mar 20",
        img: Pisces,
        bannerImg: defaultImg,
        link: "/horoscopes/daily/pisces-free-horoscope.aspx",
        overview:
          "As a water sign ruled by Neptune, Pisces flows with intuitive wisdom and boundless compassion. Your dreamy nature and psychic sensitivity allow you to navigate life's currents with remarkable emotional intelligence and creative vision.",
      },
    ],
  };
  let description =
    "Excitement will be at its peak and so will be the fear of the unknown and the unseen with Moon settling in Pisces. The power of the subconscious mind is unique and exerts a great deal of force on what may happen. So, if you are frightened that something undesirable might take place, chances are that it will definitely take place today. There is a reason why spiritual gurus all over the world advise us to think positive.Do not let negative thoughts rule you and inadvertently compel you to do something undesirable. There is every possibility that you will find a sudden change in your behavior. Those who are usually very calm and poised will be prone to temper tantrums and behave rather rudely. Shocking or not, this may land you in the soup. Don’t do anything that can tarnish your reputation or affect your relationships, avoid new endeavors and entering partnerships and yes, think positive. With Moon in Pisces, you will experience positive things happening in your professional life. A business related trip maybe on the cards too, this should be fun.";
  let horoDisc =
    "A horoscope is an astrological chart created based on the positions of the Sun, Moon, and other celestial bodies at the time of a person's birth. It provides insights into an individual's personality, likes, dislikes, thoughts, love life, career, health, and more. Horoscopes offer a glimpse into future events and can be used to make informed decisions.Horoscopic traditions are primarily associated with the Western Zodiac. Vedic Astrology, on the other hand, uses a different system with the Kundali (birth chart). While some debate the scientific validity of horoscopes, their accuracy in reflecting individual traits continues to intrigue many.";

  const onClickSign = (data) => {
    navigate(`/horoscopes/daily/${data.name}-free-horoscope`, {
      state: { data },
    });
  };

  const onChat = (data) => {
    navigate(`/astrologer/expert/${data.FirstName}`, {
      state: { data: data },
    });
  };

  return [data];
};
