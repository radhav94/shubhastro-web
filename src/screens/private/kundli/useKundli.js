import { useState } from "react";
import * as KundaliSrvices from "../../../services/appServices/kundaliServices";
import { getAstakVargaData } from "../../../services/appServices/AshtakVargaServices";

const kundliInfoData = [
  {
    type: "paragraph",
    content:
      "Now, making your janam kundali online is super easy. You just need to enter your birth details, no need to meet any astrologer or pay anything first. Websites like Shubh Talk free kundli bring this ancient knowledge right to your screen.",
  },
  {
    type: "paragraph",
    content:
      "Many people now trust online kundali making more than the old ways because it’s quick and often very accurate. Whether you’re thinking about love, work, or family, your birth chart can give you deep insights. This guide will explain how free kundli online services work and how our tools can make understanding your life journey easier and more meaningful, all at your fingertips.",
  },
  {
    type: "heading",
    level: 3,
    content:
      "Free Kundli Online - Get Your Detailed Birth Chart with Predictions",
  },
  {
    type: "paragraph",
    content:
      "Making your kundli online has made astrology simple and easy for everyone. By using a kundali generator, you can instantly get your birth chart with all the necessary planetary placements. With modern kundali maker tools, you can get quick and accurate results, just like what expert astrologers offer.",
  },
  {
    type: "paragraph",
    content:
      "A detailed kundali chart helps you explore specific life areas like career, marriage, and health with clarity. It tells you about your strengths, challenges, and important life patterns. Many people find out their hidden talents and get direction in life through their birth chart analysis.",
  },
  {
    type: "heading",
    level: 3,
    content: "Online Free Kundli For Future Predictions",
  },
  {
    type: "list",
    items: [
      "The most exciting part of your kundali analysis is finding out what’s coming next in your life.",
      "With your free online kundali, you get special periods called dashas that help you understand when good things like marriage or job changes might happen.",
      "The accuracy of your kundli prediction depends on your exact birth details. When you use a kundli maker online with the right time of birth, you get better, more reliable results.",
      "These predictions show you which periods are lucky for career growth or personal success. Knowing this in advance helps you plan better.",
      "But remember, these are just guides—not fixed fates. What truly shapes your life is your effort and the decisions you make.",
    ],
  },
  {
    type: "heading",
    level: 3,
    content: "How to Make Your Free Janam Kundli Online?",
  },
  {
    type: "list",
    items: [
      "<strong>Step 1: Pick a Good Kundli Generator</strong> <br /> Start by choosing a trusted kundli generator like the one on Shubh Talk. Our tools provide accurate, detailed, and user-friendly birth chart reports.",
      "<strong>Step 2: Collect Your Birth Details</strong> <br /> Before you begin, make sure you know your exact birth date, birth time, and birthplace. Even a small mistake can change your kundli chart.",
      "<strong>Step 3: Fill in the Kundli Maker Form</strong> <br /> Enter your name, gender, date, time (AM/PM), and city of birth in our kundli maker form.",
      "<strong>Step 4: Generate and Save Your Free Kundli Chart </strong><br /> Once filled, click to generate your janam kundli online. You can save it as a PDF or create an account for easy future access.",
      "<strong>Step 5: Read and Explore <br /> </strong> First, read about your personality. Then go deeper into career, marriage, and health. Our simple guides will help you understand your chart easily.",
    ],
  },
  {
    type: "heading",
    level: 3,
    content: "Conclusion",
  },
  {
    type: "paragraph",
    content:
      "Free online kundli tools make it easy for anyone to understand astrology. These tools quickly show details about your nature, job, relationships, and life path. Your janam kundli is like a map that helps you make better life choices.",
  },
  {
    type: "paragraph",
    content:
      "Astrology doesn’t control you, it guides you. Your free kundli shows your strengths and challenges, but your actions matter most. Use this knowledge to live a better, more meaningful life.",
  },
];

const monthMap = {
  Jan: 1,
  January: 1,
  Feb: 2,
  February: 2,
  Mar: 3,
  March: 3,
  Apr: 4,
  April: 4,
  May: 5,
  Jun: 6,
  June: 6,
  Jul: 7,
  July: 7,
  Aug: 8,
  August: 8,
  Sep: 9,
  September: 9,
  Oct: 10,
  October: 10,
  Nov: 11,
  November: 11,
  Dec: 12,
  December: 12,
};

export const useKundli = () => {
  const [dataIsFilled, setDataIsFilled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [basicData, setBasicData] = useState([]);
  const [userData, setUserData] = useState("");
  const [planetData, setPlanetData] = useState([]);
  const [kpDetails, setKpDetails] = useState([]);
  const [charts, setCharts] = useState([]);
  const [ashtakvarga, setAshtakvarga] = useState(null);
  const [dasha, setDasha] = useState(null);
  const [report, setReport] = useState(null);

  const onGenerateClick = async (e) => {
    try {
      setIsLoading(true);

      const data = {
        day: Number(e.day),
        month: monthMap[e.month] || 1,
        year: Number(e.year),
        hour: Number(e.hour),
        min: Number(e.minute),
        lat: Number(e.latitude),
        lon: Number(e.longitude),
        tzone: Number(e.timezone) || 5.5,
      };
      const ashtakVargaData = {
        birth_day: Number(e.day),
        birth_month: monthMap[e.month] || 1,
        birth_year: Number(e.year),
        birth_hour: Number(e.hour),
        birth_min: Number(e.minute),
        latitude: Number(e.latitude),
        longitude: Number(e.longitude),
        time_zone: "Asia/Kolkata",
      };

      const res = await KundaliSrvices.getKundliData(data);
      const ashtakvargaResponse = await getAstakVargaData(ashtakVargaData);
      const freeReportResponse = await KundaliSrvices.getData(data);
      setAshtakvarga(ashtakvargaResponse);

      setBasicData({
        birthDetails: res?.birthDetails || null,
        birthPanchang: res?.birthPanchang || null,
        astroDetails: res?.astroDetails || null,
      });

      setPlanetData({
        planetData: res.planetDetails || [],
        birthChart: res.birth_chart || "",
        navamasaChart: res.navamsa_chart || "",
      });
      setKpDetails({
        rulingPlanets: res.ruling_planets || null,
        chalitChart: res.chalit_chart || "",
      });
      setDasha({
        yogini: res.yogini || null,
      });
      setReport({
        general: {
          planatery: {
            sun: freeReportResponse.sun,
            moon: freeReportResponse.moon,
            mars: freeReportResponse.mars,
            mercury: freeReportResponse.mercury,
            jupiter: freeReportResponse.jupiter,
            saturn: freeReportResponse.saturn,
            venus: freeReportResponse.venus,
          },
        },
      });
      setCharts({
        chalitChart: res.chalit_chart || "",
        sunChart: res.sunChart || "",
        moonChart: res.moonChart || "",
        birthChart: res.birth_chart || "",
        horaChart: res.horaChart || "",
        drekkanaChart: res.drekkanaChart || "",
        chaturthamsaChart: res.chaturthamsaChart || "",
        saptamsaChart: res.saptamsaChart || "",
        navamsaChart: res.navamsa_chart || "",
        dasamsaChart: res.dasamsaChart || "",
        dwadasamsaChart: res.dwadasamsaChart || "",
        shodasamsaChart: res.shodasamsaChart || "",
        vimsamsaChart: res.vimsamsaChart || "",
        chaturvisamsaChart: res.chaturvisamsaChart || "",
        saptavisamsaChart: res.saptavisamsaChart || "",
        trimsamsaChart: res.trimsamsaChart || "",
        khavedamsaChart: res.khavedamsaChart || "",
        akshavedamsaChart: res.akshavedamsaChart || "",
        shashtiamsaChart: res.shashtiamsaChart || "",
      });
      setUserData(e);
      setDataIsFilled(true);
    } catch (error) {
      setDataIsFilled(false);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return [
    dataIsFilled,
    setDataIsFilled,
    isLoading,
    setIsLoading,
    basicData,
    setBasicData,
    kundliInfoData,
    monthMap,
    onGenerateClick,
    userData,
    planetData,
    kpDetails,
    charts,
    ashtakvarga,
    dasha,
    report,
  ];
};
