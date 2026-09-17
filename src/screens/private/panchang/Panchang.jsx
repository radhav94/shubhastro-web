import React from "react";
import ContentCard from "../../../component/UI/cards/ContentCard";
import WorkInProgressCard from "../../../component/UI/cards/WorkInProgressCard";
import InternalBanner from "../../../component/UI/cards/internalBanner/InternalBanner";
import { appColors } from "../../../utils/theme";
import { usePanchang } from "./usePanchang";
import Astrologers from "../home/components/astrologers/Astrologers";
import Blogs from "../home/components/blogs/Blogs";

const Panchang = () => {
  const [data, zodiacData, onChat, onCardClick] = usePanchang();

  return (
    <>
      <InternalBanner data={data} onCardClick={onCardClick} />
      <ContentCard
        title="Today’s Panchang"
        description={
          "Indian scriptures to provide information relevant to astrologers for them to forecast planetary occurrences"
        }
        bgColor={appColors.sec}
        showDate={true}
        isDailyHoroscope
        zodiacData={zodiacData}
      />

      <ContentCard
        title="What You Need to Know About The Hindu Calendar?"
        description={
          "Hindu calendars are divided into two categories Solar calendar (Surya ganana), which is based on the Sun's entry into different zodiac signs.Lunar calendar (Chandra ganana) which is based on the Moon's transit. However, the majority of the calculations are based on the Moon's orbit. Panchang uses the lunar month system to measure time, with each month's name indicating the Moon's passage through each Nakshatra. Our Panchang follows the lunar calendar calculation, which is the most popular Hindu calendar in India."
        }
        bgColor="transparent"
      />
      <ContentCard
        title="Panchang: What Are Its Elements?"
        description={
          "through each Nakshatra. Our Panchang follows the lunar calendar calculation, which is the most popular Hindu calendar in India. Panchang: What Are Its Elements? The Sanskrit word Panchangam, also known as Panchang, is made up of two words: panch, which means five, and ang, which means parts. Panchang is created by taking into account five aspects or elements of traditional Hindu timekeeping: Tithi, Nakshatra, Yog, Vaar, and Karana. Let's understand each of these elements in more detail."
        }
        bgColor="transparent"
      />
      <ContentCard
        title="How Is Panchang Beneficial?"
        description={
          "The study of Panchang is the fundamental understanding of Rashi Phala in English, the impact of each of the 12 zodiac signs on an individual, and how their day-to-day lives change based on several movements of the planets. The casting of a Panchang requires detailed mathematical work involving a high level of spherical geometry and an in-depth understanding of the movements of the planets and the stars. Panchang is created for the fundamental purpose of providing information on how a day might look, how people should optimize the 'Shubh' or positive span of time in order to lead a happy and prosperous life, and what they should refrain from doing at negative hours of the day to avoid problems. Panchang is optimally utilized in Hindu culture for planning important events and functions in a person's life. Panchang matches the current planetary configurations with the position of the heavenly bodies in a person's astrological chart so that auspicious days and times can be pin-pointed in their best interests.The Panchang is also used to calculate a person's Vedic birth chart or natal chart. The calculations done to create a Panchang are based upon the position or movement of planets, stars, or Nakshatra in a certain sign at certain degrees. These calculations represent how these movements and transitions are supposed to affect a person on a particular date and can be done to minimize the negative effects and maximize the positive effects. With the help of Panchang, you can accurately plan your job interviews, travel plans, investments, festivals, pujas, and the beginning of any significant tasks."
        }
        bgColor="transparent"
      />

      <Astrologers onChat={onChat} />
      <Blogs />
    </>
  );
};

export default Panchang;
