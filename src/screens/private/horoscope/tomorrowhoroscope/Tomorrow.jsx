import { useLocation, useParams } from "react-router-dom";
import styles from "../dailyHoroscope/Daily.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";

import { appSvgs } from "../../../../utils/appImages";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import { useFetchNextQuery } from "../../../../redux/api/horoscope/zodiacApi";
import { useEffect, useState } from "react";
import axios from "axios";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import SideBar from "../../../../layouts/sidebar/SideBar";
import Sidebar from "../sidebar/Sidebar";

const Tomorrow = () => {
  const { sign } = useParams();

  const payload = { timezone: 5.5 };

  const { data, isLoading, error, isSuccess, refetch } = useFetchNextQuery(
    { sign, payload },
    { enabled: !!sign }
  );

  return (
    <div className={styles.dailyContainer}>
      <PrimaryLoader isLoading={isLoading} />
      {data && (
        <div>
          <PrimaryText isCenter isBold size_32>
            {sign.charAt(0).toUpperCase() + sign.slice(1)} Tomorrow Horoscope
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
        <div className={styles.rightSideContainer}>
          <PrimaryText isSemiBold size_20>
            {sign.charAt(0).toUpperCase() + sign.slice(1)} Tomorrow Horoscope
          </PrimaryText>
          <PrimaryText
            paddingBottom="20px"
            isItalic
            isSemiBold
            size_16
            color={appColors.greyDark}
          >
            {new Date().toString().slice(3, 15)}
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
export default Tomorrow;
