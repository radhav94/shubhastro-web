import { useLocation, useParams } from "react-router-dom";
import styles from "./Daily.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import { appSvgs } from "../../../../utils/appImages";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import { useFetchDailyQuery } from "../../../../redux/api/horoscope/zodiacApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import Sidebar from "../sidebar/Sidebar";
import { signToNumber, zodiacDateRanges } from "../utils";
import { formatted } from "../../../../utils/dateFormat/date";

const Daily = () => {
  const { sign } = useParams();
  const { pathname } = useLocation();
  let horoscopeType = pathname.split("/")[2].split("-")[0];
  horoscopeType =
    horoscopeType.charAt(0).toUpperCase() + horoscopeType.slice(1);
  console.log(useLocation(), "useLocation");
  const signNumber = signToNumber[sign.toLowerCase()];

  const { data, isLoading, isSuccess } = useFetchDailyQuery(signNumber);

  const dateRange = zodiacDateRanges[sign.toLowerCase()] || "Unknown Sign";

  const bot = data?.response?.bot_response;

  return (
    <div className={styles.dailyContainer}>
      <PrimaryLoader isLoading={isLoading} />

      {data && (
        <div>
          <PrimaryText isCenter isBold size_32>
            {sign.charAt(0).toUpperCase() + sign.slice(1)} {horoscopeType}{" "}
            Horoscope
          </PrimaryText>

          <PrimaryText
            isCenter
            isSemiBold
            size_20
            marginBottom="6px"
            color={appColors.greyDark}
          >
            {formatted}
          </PrimaryText>

          <DividerWithImage
            imageSrc={appSvgs[sign.charAt(0).toUpperCase() + sign.slice(1)]}
          />
        </div>
      )}

      <div className={styles.sidebar}>
        <Sidebar />

        <div>
          {/* HEADER */}
          <PrimaryText isSemiBold size_20>
            {sign.charAt(0).toUpperCase() + sign.slice(1)} Horoscope
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

          {/*  LUCKY DETAILS */}
          {isSuccess && (
            <div style={{ marginBottom: "20px" }}>
              <PrimaryText size_20 isBold>
                Lucky Details
              </PrimaryText>

              <PrimaryText size_16 color={appColors.greyDark}>
                <strong>Lucky Color:</strong>{" "}
                <span style={{ color: data.response.lucky_color_code }}>
                  {data.response.lucky_color}
                </span>
              </PrimaryText>

              <PrimaryText size_16 color={appColors.greyDark}>
                <strong>Lucky Number:</strong>{" "}
                {data?.response?.lucky_number?.length > 0 &&
                  data?.response?.lucky_number?.join(", ")}
              </PrimaryText>
            </div>
          )}

          {/*  MAIN BOT RESPONSE */}
          {isSuccess &&
            Object.entries(bot || {}).map(([key, value]) => (
              <div key={key} style={{ marginBottom: "15px" }}>
                <PrimaryText paddingBottom="5px" size_20>
                  {key
                    .replace(/_/g, " ")
                    .split(" ")
                    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
                    .join(" ")}
                  {"  "}
                  <span style={{ fontSize: "14px", color: "orange" }}>
                    ({value.score}/100)
                  </span>
                </PrimaryText>

                <PrimaryText
                  paddingBottom="10px"
                  size_16
                  color={appColors.greyDark}
                >
                  {value.split_response}
                </PrimaryText>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Daily;
