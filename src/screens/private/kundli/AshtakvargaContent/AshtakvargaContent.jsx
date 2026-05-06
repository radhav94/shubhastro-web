import React from "react";
import styles from "./AshtakvargaContent.module.scss";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import { useSelector } from "react-redux";
import { useFetchAshtakvargaChartQuery } from "../../../../redux/api/kundli/ashtakvargaApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { useGetAshtakvargaChartQuery } from "../../../../redux/api/kundli/kundliApi";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import { sanitizeSvg } from "../../../../utils/helper/sanitizeSvg";
import TTSButton from "../../../../component/UI/TTSButton";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const AshtakvargaContent = () => {
  // const { Jupiter, Mars, Mercury, Moon, Sarva, Saturn, Sun, Venus } = data?.data

  const payload = useSelector((state) => state?.form?.kundliPayload);
  const params = payload ? buildVedicParam(payload) : null;

  // const { data, isSuccess, isLoading } = useFetchAshtakvargaChartQuery(
  //   payload ? { payload } : skipToken
  // );
  const dSun = useGetAshtakvargaChartQuery(
    params ? { chartType: "Sun", params } : skipToken
  );
  const moon = useGetAshtakvargaChartQuery(
    params ? { chartType: "Moon", params } : skipToken
  );
  const mars = useGetAshtakvargaChartQuery(
    params ? { chartType: "Mars", params } : skipToken
  );
  const mercury = useGetAshtakvargaChartQuery(
    params ? { chartType: "Mercury", params } : skipToken
  );
  const venus = useGetAshtakvargaChartQuery(
    params ? { chartType: "Venus", params } : skipToken
  );
  const jupiter = useGetAshtakvargaChartQuery(
    params ? { chartType: "Jupiter", params } : skipToken
  );
  const saturn = useGetAshtakvargaChartQuery(
    params ? { chartType: "Saturn", params } : skipToken
  );
  const total = useGetAshtakvargaChartQuery(
    params ? { chartType: "total", params } : skipToken
  );

  const svgUrl = (raw) =>
    sanitizeSvg(raw) || null;

  const charts = [
    { title: "Sun", src: svgUrl(dSun.data) },
    { title: "Moon", src: svgUrl(moon.data) },
    { title: "Mars", src: svgUrl(mars.data) },
    { title: "Mercury", src: svgUrl(mercury.data) },
    { title: "Venus", src: svgUrl(venus.data) },
    { title: "Jupiter", src: svgUrl(jupiter.data) },
    { title: "Saturn", src: svgUrl(saturn.data) },
    { title: "Total", src: svgUrl(total.data) },
  ];

  // Usage
  // const JupiterUrl = getSvgUrl(data?.data?.Jupiter);
  // const MarsUrl = getSvgUrl(data?.data?.Mars);
  // const MercuryUrl = getSvgUrl(data?.data?.Mercury);
  // const MoonUrl = getSvgUrl(data?.data?.Moon);
  // const sarvaUrl = getSvgUrl(data?.data?.Sarva);
  // const saturnUrl = getSvgUrl(data?.data?.Saturn);
  const sunUrl = svgUrl(dSun.data);
  // const venusUrl = getSvgUrl(data?.data?.Venus);

  return (
    <>
      {/* <PrimaryLoader isLoading={isLoading} /> */}
      {true && (
        <div className={styles.mainContainer}>
          <div className={styles.textContainer}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <h1 className={styles.cardTitle}>Ashtakvarga Chart</h1>
              <TTSButton text="Ashtakvarga Chart. Ashtakvarga is used to assess the strength and patterns that are present in a birth chart. The Ashtakvarga or Ashtakavarga is a numerical quantification or score of each planet placed in the chart with reference to the other 7 planets and the Lagna. In Sarva Ashtaka Varga the total scores of all the BAVs are overlaid and then totalled. This makes the SAV of the chart. The total of all the scores should be 337" />
            </div>
            <p>
              Ashtakvarga is used to assess the strength and patterns that are
              present in a birth chart. The Ashtakvarga or Ashtakavarga is a
              numerical quantification or score of each planet placed in the
              chart with reference to the other 7 planets and the Lagna. In
              Sarva Ashtaka Varga the total scores of all the BAVs are overlaid
              and then totalled. This makes the SAV of the chart. The total of
              all the scores should be 337
            </p>
          </div>
          <div className={styles.grid}>
            {charts.map(
              (chart, index) =>
                chart.src && (
                  <DynamicChart
                    key={index}
                    title={chart.title}
                    src={chart.src}
                    fontSize ={20}
                  />
                )
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AshtakvargaContent;
