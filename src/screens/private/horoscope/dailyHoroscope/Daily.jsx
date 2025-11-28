import { useLocation, useParams } from "react-router-dom";
import styles from "./Daily.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";

import { appSvgs } from "../../../../utils/appImages";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import { useFetchDailyQuery } from "../../../../redux/api/horoscope/zodiacApi";
import { useEffect, useState } from "react";
import axios from "axios";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import Sidebar from "../sidebar/Sidebar";

// Zodiac Sign Date Ranges
const zodiacDateRanges = {
  aries: "March 21 - April 19",
  taurus: "April 20 - May 20",
  gemini: "May 21 - June 20",
  cancer: "June 21 - July 22",
  leo: "July 23 - August 22",
  virgo: "August 23 - September 22",
  libra: "September 23 - October 22",
  scorpio: "October 23 - November 21",
  sagittarius: "November 22 - December 21",
  capricorn: "December 22 - January 19",
  aquarius: "January 20 - February 18",
  pisces: "February 19 - March 20",
};

const Daily = () => {
  const { sign } = useParams();

  const payload = { timezone: 5.5 };

  const { data, isLoading, error, isSuccess, refetch } = useFetchDailyQuery(
    { sign, payload },
    { enabled: !!sign }
  );

  const dateRange = zodiacDateRanges[sign.toLowerCase()] || "Unknown Sign";

  return (
    <div className={styles.dailyContainer}>
      <PrimaryLoader isLoading={isLoading} />
      {data && (
        <div>
          <PrimaryText isCenter isBold size_32>
            {sign.charAt(0).toUpperCase() + sign.slice(1)} Daily Horoscope
          </PrimaryText>
          <PrimaryText isCenter isSemiBold size_18 color={appColors.greyDark}>
            {new Date().toString().slice(3, 15)}
          </PrimaryText>
          <DividerWithImage
            imageSrc={appSvgs[sign.charAt(0).toUpperCase() + sign.slice(1)]}
          />
        </div>
      )}
      <div className={styles.sidebar}>
        <Sidebar />
        <div>
          <PrimaryText isSemiBold size_20>
            {sign.charAt(0).toUpperCase() + sign.slice(1)} Daily Horoscope
          </PrimaryText>
          <PrimaryText
            paddingBottom="20px"
            isItalic
            isSemiBold
            size_16
            color={appColors.greyDark}
          >
            {dateRange}
          </PrimaryText>
          {isSuccess &&
            Object.entries(data.prediction).map(([key, value]) => (
              <div key={key}>
                <PrimaryText paddingBottom="5px" size_20>
                  {key
                    .replace(/_/g, " ")
                    .split(" ")
                    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
                    .join(" ")}
                </PrimaryText>
                <PrimaryText
                  paddingBottom="15px"
                  size_16
                  color={appColors.greyDark}
                >
                  {value}
                </PrimaryText>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
export default Daily;
