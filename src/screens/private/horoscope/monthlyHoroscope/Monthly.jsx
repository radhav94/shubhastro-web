import { useLocation, useParams } from "react-router-dom";
import styles from "../dailyHoroscope/Daily.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";

import { appSvgs } from "../../../../utils/appImages";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import { useFetchMonthQuery } from "../../../../redux/api/horoscope/zodiacApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import Sidebar from "../sidebar/Sidebar";

const Monthly = () => {
  const { sign } = useParams();

  const payload = { timezone: 5.5 };

  const { data, isLoading, error, isSuccess, refetch } = useFetchMonthQuery(
    { sign, payload },
    { enabled: !!sign }
  );

  return (
    <div className={styles.dailyContainer}>
      <PrimaryLoader isLoading={isLoading} />
      {data && (
        <div>
          <PrimaryText isCenter isBold size_32>
            {sign.charAt(0).toUpperCase() + sign.slice(1)} Monthly Horoscope
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
            {sign.charAt(0).toUpperCase() + sign.slice(1)} Monthly Horoscope
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
            data.prediction.map((data, index) => (
              <div key={index}>
                <PrimaryText
                  paddingBottom="15px"
                  size_16
                  color={appColors.greyDark}
                >
                  {data}
                </PrimaryText>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
export default Monthly;
