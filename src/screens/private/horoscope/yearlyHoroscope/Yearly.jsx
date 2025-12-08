import { useParams } from "react-router-dom";
import styles from "../dailyHoroscope/Daily.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import { appSvgs } from "../../../../utils/appImages";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import { useFetchYearlyQuery } from "../../../../redux/api/horoscope/zodiacApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import Sidebar from "../sidebar/Sidebar";
import { signToNumber, Today, zodiacDateRanges } from "../utils";

const Yearly = () => {
  const { sign } = useParams();
  const signNumber = signToNumber[sign.toLowerCase()];

  const { data, isLoading, isSuccess } = useFetchYearlyQuery(signNumber);

  const dateRange = zodiacDateRanges[sign.toLowerCase()] || "Unknown Sign";

  const yearly = data?.response;

  // helper: convert key to Title Case
  const toTitle = (str) =>
    str
      .replace(/_/g, " ")
      .split(" ")
      .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
      .join(" ");

  return (
    <div className={styles.dailyContainer}>
      <PrimaryLoader isLoading={isLoading} />

      {/* HEADER */}
      {data && (
        <div>
          <PrimaryText isCenter isBold size_32>
            {toTitle(sign)} Yearly Horoscope
          </PrimaryText>

          <PrimaryText isCenter isSemiBold size_18 color={appColors.greyDark}>
            {Today}
          </PrimaryText>

          <DividerWithImage imageSrc={appSvgs[toTitle(sign)]} />
        </div>
      )}

      <div className={styles.sidebar}>
        <Sidebar />

        <div>
          {/* SUBHEADER */}
          <PrimaryText isSemiBold size_20>
            {toTitle(sign)} Horoscope
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

          {/* MAP ALL 4 PHASES */}
          {isSuccess &&
            ["phase_1", "phase_2", "phase_3", "phase_4"].map(
              (phaseKey, idx) => {
                const phase = yearly[phaseKey];
                if (!phase) return null;

                return (
                  <div key={phaseKey} style={{ marginBottom: "30px" }}>
                    {/* PHASE HEADING */}
                    <PrimaryText size_20 isBold paddingBottom="5px">
                      Quarter {idx + 1}: {phase.period}
                    </PrimaryText>

                    <PrimaryText
                      size_16
                      color={appColors.greyDark}
                      paddingBottom="15px"
                    >
                      <strong>Overall Score:</strong> {phase.score}/100
                    </PrimaryText>

                    {/* MAIN PREDICTION */}
                    <PrimaryText size_18 isSemiBold paddingBottom="5px">
                      Overall Prediction
                    </PrimaryText>

                    <PrimaryText
                      size_16
                      color={appColors.greyDark}
                      paddingBottom="20px"
                    >
                      {phase.prediction}
                    </PrimaryText>

                    {/* MAP EACH CATEGORY INSIDE PHASE */}
                    {[
                      "physique",
                      "health",
                      "relationship",
                      "career",
                      "travel",
                      "family",
                      "friends",
                      "finances",
                      "status",
                    ].map((cat) => {
                      const item = phase[cat];
                      if (!item) return null;

                      return (
                        <div key={cat} style={{ marginBottom: "18px" }}>
                          <PrimaryText paddingBottom="5px" size_20>
                            {toTitle(cat)}{" "}
                            <span style={{ fontSize: "14px", color: "orange" }}>
                              ({item.score}/100)
                            </span>
                          </PrimaryText>

                          <PrimaryText
                            paddingBottom="10px"
                            size_16
                            color={appColors.greyDark}
                          >
                            {item.prediction}
                          </PrimaryText>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            )}
        </div>
      </div>
    </div>
  );
};

export default Yearly;
