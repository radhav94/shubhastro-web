import React from "react";
import { useTodayPanchang } from "./useTodayPanchang";
import InternalBanner from "../../../../component/UI/cards/internalBanner/InternalBanner";
import { ContentCard, PanchangInputCard } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import Astrologers from "../../home/components/astrologers/Astrologers";
import Blogs from "../../home/components/blogs/Blogs";

const TodayPanchang = () => {
  const [data, onCardClick, onSubmit, zodiacDetails, onChat] =
    useTodayPanchang();

  return (
    <>
      <InternalBanner data={data} onCardClick={onCardClick} />
      <PanchangInputCard
        imageSrc={
          "https://images.astroyogi.com/astroyogi/panchang/panchang_widget.webp"
        }
        title={"Today's Panchang"}
        onSubmit={onSubmit}
      />
      <ContentCard
        title="Ujjain, Wednesday, 08 October 2025"
        zodiacData={zodiacDetails}
        isDailyHoroscope
        bgColor={appColors.sec}
        showDate
        singleRow
      />
      <ContentCard
        title="How is Panchang Today Calculated?"
        bgColor="transparent"
        description={`In Hindu culture, it is believed that starting a new task at the most productive time will result in positive outcomes. As a result, it is necessary to check for the appropriate time, which includes Nakshatras in favorable states, planetary movements in beneficial forms, etc.\n\nToday Panchangam is an amalgam of all the factors that Astroyogi took into consideration when creating it.\n\nToday's Panchang is a compilation of in-depth analyses of times and dates for a given day or a future day organized in a tabular format. The Nakshatras, or lunar mansions, provide astronomical data that supports the auspiciousness of these dates in addition to their astrological aspects.\n\nThe calculations are entirely based on the movements of planets and stars at a certain degree of measurement. The method of calculation involves determining the Moon's location within a specific Nakshatra of an individual's birth chart.\n\n*Note: It's important to know that Panchang Muhurats might differ between two locations at the same time. For instance, despite having the same time and date chosen, Panchang Delhi and Panchang Mumbai may not be the same on a given day or year. There might be variations in Panchang at the same time, even within Indian states and cities or any location.`}
      />
      <ContentCard
        title="What Is The Need To Find A Good Time Today?"
        bgColor="transparent"
        description={`The Panchang, a comprehensive Hindu calendar, guides astrologers in predicting planetary events and determining favorable and unfavorable times for significant life activities.\n\nThe daily Panchang can offer good timings today to carry out important rituals and events. Whether it's religious rituals, weddings, festivals, educational pursuits, travel plans, or investments, the Panchang is an essential tool for planning these crucial moments with precision. This is why you should turn to Astroyogi's daily Panchang to find a good time today.\n\nIn a way, today Panchang offers today's good time so that you can plan your day as efficiently as possible.\n\nRemember that the Panchang doesn't help you change the cosmic forces for your benefit but tells you when you can plan your propitious, new, or meaningful tasks.`}
      />
      <ContentCard
        title="Why Should You Check Out the Auspicious Time Today?"
        bgColor="transparent"
        description={`In Hindu culture, it is believed that starting a new task at the most productive time will result in positive outcomes. As a result, it is necessary to check for the appropriate time, which includes Nakshatras in favorable states, planetary movements in beneficial forms, etc.\n\nToday Panchangam is an amalgam of all the factors that Astroyogi took into consideration when creating it.\n\nToday's Panchang is a compilation of in-depth analyses of times and dates for a given day or a future day organized in a tabular format. The Nakshatras, or lunar mansions, provide astronomical data that supports the auspiciousness of these dates in addition to their astrological aspects.\n\nThe calculations are entirely based on the movements of planets and stars at a certain degree of measurement. The method of calculation involves determining the Moon's location within a specific Nakshatra of an individual's birth chart.\n\n*Note: It's important to know that Panchang Muhurats might differ between two locations at the same time. For instance, despite having the same time and date chosen, Panchang Delhi and Panchang Mumbai may not be the same on a given day or year. There might be variations in Panchang at the same time, even within Indian states and cities or any location.`}
      />
      <ContentCard
        title="How is Panchang Today Calculated?"
        bgColor="transparent"
        description={`Is today's auspicious day in the Hindu calendar? Yes! The daily Panchang can be vital in helping you choose the right time, i.e., Shubh Muhurat or an auspicious time for performing rituals and conducting important work. People and expert astrologers rely on daily Panchang to determine auspicious timings for a myriad of religious and social events.\n\nWhether you are looking to conduct a Naamkaran ceremony (ceremony for giving an appropriate name to your baby), perform a Griha Pravesh ceremony before moving into a new house or wedding nuptials, the daily Panchang can come up with an auspicious time today.\n\nThis is not limited to religious rituals like Pujas and Vrats (fasts) or spiritual events only; the daily Panchang can also offer you good timings today or the best timing for any day to purchase a car, begin a new job, or launch your business.\n\nFollowing the auspicious timing as per the celestial alignment can help bring success and growth in all your endeavors. Maintaining Shubh Muhurats can significantly impact your daily life.\n\nHowever, have you ever wondered what makes a particular time or Muhurat auspicious?\n\nWell, it's the complicated balance of multiple astrological factors. The Lunar day (Tithi), Nakshatra (constellation), the day of the week (Vara), Yoga (Luni-Solar day), Karana (half of a Lunar day), and the planetary periods (Dasha) are all vital for identifying the perfect timing for any event. For example, the Tithi can assist you in planning your spiritual events, as every Lunar day has its own energies. Moreover, the occasion or task is also considered, as the auspicious timing for a wedding will not be suitable for making an important business decision.\n\nWhether it's a mundane everyday task or a noteworthy event, today's good times and bad times should be taken into consideration to enhance the success rate and positive impact of that event.`}
      />
      <Astrologers onChat={onChat} />
      <Blogs />
    </>
  );
};

export default TodayPanchang;
