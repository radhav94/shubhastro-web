import { useSelector } from "react-redux";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import styles from "./ChartsContent.module.scss";
import { useGetChartQuery } from "../../../../redux/api/kundli/kundliApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { skipToken } from "@reduxjs/toolkit/query";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import { sanitizeSvg } from "../../../../utils/helper/sanitizeSvg";

const SouthIndian = ({ style = "south" }) => {
  const payload = useSelector((state) => state?.form?.kundliPayload);
  const params = payload ? buildVedicParam(payload, { style }) : null;

  /** ↓↓↓ CALL EACH CHART INDIVIDUALLY ↓↓↓ */

  const dChalit = useGetChartQuery(
    params ? { chartType: "chalit", params } : skipToken
  );
  const dSun = useGetChartQuery(
    params ? { chartType: "sun", params } : skipToken
  );
  const dMoon = useGetChartQuery(
    params ? { chartType: "moon", params } : skipToken
  );
  const kpChalit = useGetChartQuery(
    params ? { chartType: "kp_chalit", params } : skipToken
  );
  const transit = useGetChartQuery(
    params ? { chartType: "transit", params } : skipToken
  );
  const d1 = useGetChartQuery(params ? { chartType: "D1", params } : skipToken);
  const d2 = useGetChartQuery(params ? { chartType: "D2", params } : skipToken);
  const d3 = useGetChartQuery(params ? { chartType: "D3", params } : skipToken);
  const d3s = useGetChartQuery(
    params ? { chartType: "D3-s", params } : skipToken
  );
  const d4 = useGetChartQuery(params ? { chartType: "D4", params } : skipToken);
  const d5 = useGetChartQuery(params ? { chartType: "D5", params } : skipToken);
  const d7 = useGetChartQuery(params ? { chartType: "D7", params } : skipToken);
  const d8 = useGetChartQuery(params ? { chartType: "D8", params } : skipToken);
  const d9 = useGetChartQuery(params ? { chartType: "D9", params } : skipToken);
  const d10 = useGetChartQuery(
    params ? { chartType: "D10", params } : skipToken
  );
  const d10r = useGetChartQuery(
    params ? { chartType: "D10-R", params } : skipToken
  );
  const d12 = useGetChartQuery(
    params ? { chartType: "D12", params } : skipToken
  );
  const d16 = useGetChartQuery(
    params ? { chartType: "D16", params } : skipToken
  );
  const d20 = useGetChartQuery(
    params ? { chartType: "D20", params } : skipToken
  );
  const d24 = useGetChartQuery(
    params ? { chartType: "D24", params } : skipToken
  );
  const d24r = useGetChartQuery(
    params ? { chartType: "D24-R", params } : skipToken
  );
  const d27 = useGetChartQuery(
    params ? { chartType: "D27", params } : skipToken
  );
  const d30 = useGetChartQuery(
    params ? { chartType: "D30", params } : skipToken
  );
  const d40 = useGetChartQuery(
    params ? { chartType: "D40", params } : skipToken
  );
  const d45 = useGetChartQuery(
    params ? { chartType: "D45", params } : skipToken
  );
  const d60 = useGetChartQuery(
    params ? { chartType: "D60", params } : skipToken
  );

  /** ↓↓↓ Build safe SVG URLs ↓↓↓ */

  const svgUrl = (raw) => sanitizeSvg(raw) || null;

  const charts = [
    { title: "Chalit", src: svgUrl(dChalit.data) },
    { title: "Sun Chart", src: svgUrl(dSun.data) },
    { title: "Moon Chart", src: svgUrl(dMoon.data) },
    { title: "KP Chalit", src: svgUrl(kpChalit.data) },
    { title: "Transit Chart", src: svgUrl(transit.data) },
    { title: "Lagna / Ascendant / Basic Birth Chart", src: svgUrl(d1.data) },
    { title: "Hora (Wealth / Income Chart)", src: svgUrl(d2.data) },
    { title: "Drekkana (Relationship with siblings)", src: svgUrl(d3.data) },
    { title: "Special Drekkana (Secret enemies)", src: svgUrl(d3s.data) },
    { title: "Chaturthamsa (Assets)", src: svgUrl(d4.data) },
    { title: "Panchamsa (Power)", src: svgUrl(d5.data) },
    { title: "Saptamsa (Progeny)", src: svgUrl(d7.data) },
    { title: "Asthamsa", src: svgUrl(d8.data) },
    { title: "Navamsa (Prospects of marriage)", src: svgUrl(d9.data) },
    { title: "Dasamsa (Profession)", src: svgUrl(d10.data) },
    { title: "Dasamsa (Retro Version)", src: svgUrl(d10r.data) },
    { title: "Dwadasamsa (Ancestors)", src: svgUrl(d12.data) },
    { title: "Shodasamsa (Travel)", src: svgUrl(d16.data) },
    { title: "Vimsamsa (Spiritual progress)", src: svgUrl(d20.data) },
    { title: "Chaturvimsamsa (Intellectual)", src: svgUrl(d24.data) },
    { title: "Chaturvimsamsa (Alternative D24)", src: svgUrl(d24r.data) },
    { title: "Saptavimsamsa (Strength)", src: svgUrl(d27.data) },
    { title: "Trimsamsa (Misfortunes)", src: svgUrl(d30.data) },
    { title: "Khavedamsa (Auspicious time)", src: svgUrl(d40.data) },
    { title: "Akshavedamsa (General issues)", src: svgUrl(d45.data) },
    { title: "Shastiamsa (Summary of charts)", src: svgUrl(d60.data) },
  ];

  const loading = charts.some((c, i) => {
    const chart = [
      dChalit,
      dSun,
      dMoon,
      kpChalit,
      transit,
      d1,
      d2,
      d3,
      d3s,
      d4,
      d5,
      d7,
      d8,
      d9,
      d10,
      d10r,
      d12,
      d16,
      d20,
      d24,
      d24r,
      d27,
      d30,
      d40,
      d45,
      d60,
    ][i];
    return chart?.isLoading;
  });

  return (
    <div>
      <PrimaryLoader isLoading={loading} />

      <div className={styles.mainContainer}>
        <div className={styles.grid}>
          {charts.map(
            (chart, index) =>
              chart.src && (
                <DynamicChart key={index} title={chart.title} src={chart.src} />
              )
          )}
        </div>
      </div>
    </div>
  );
};

export default SouthIndian;
