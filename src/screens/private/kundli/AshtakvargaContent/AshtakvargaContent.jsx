import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import styles from "./AshtakvargaContent.module.scss";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import { useSelector } from "react-redux";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { useGetAshtakvargaChartQuery } from "../../../../redux/api/kundli/kundliApi";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import { sanitizeSvg } from "../../../../utils/helper/sanitizeSvg";
import TTSButton from "../../../../component/UI/TTSButton";
import useLang from "../../../../utils/hooks/useLang";

const AshtakvargaContent = () => {
  const [activeTab, setActiveTab] = useState("north");

  const payload = useSelector((state) => state?.form?.kundliPayload);
  // `lang` comes from the hook rather than being read inline so a language
  // change re-renders and refetches, matching KpContent / ChartsContent.
  const lang = useLang();
  const params = payload ? buildVedicParam(payload, { style: activeTab, lang }) : null;

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

  const svgUrl = (raw) => sanitizeSvg(raw) || null;

  const charts = [
    { title: "Sun", query: dSun },
    { title: "Moon", query: moon },
    { title: "Mars", query: mars },
    { title: "Mercury", query: mercury },
    { title: "Venus", query: venus },
    { title: "Jupiter", query: jupiter },
    { title: "Saturn", query: saturn },
    { title: "Total", query: total },
  ].map(({ title, query }) => ({ title, query, src: svgUrl(query.data) }));

  /*
    Switching North/South changes `style`, which is part of the RTK Query cache
    key, so all eight charts become uncached and their `data` goes undefined.
    The grid below only renders entries that have a `src`, so without this the
    whole grid emptied out on tap with nothing to replace it — the tab looked
    dead and invited a re-tap while eight third-party chart requests were still
    in flight. `isFetching` (not `isLoading`) so a return to an
    already-cached tab still reports the refetch.
  */
  const loading = charts.some(({ query }) => query?.isFetching);

  return (
    <div className={styles.mainContainer}>
      {/* North/South Indian Tab Switcher */}
      <div className={styles.tabGroup}>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "north" ? styles.activeTab : ""}`}
          aria-pressed={activeTab === "north"}
          onClick={() => setActiveTab("north")}
        >
          North Indian
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "south" ? styles.activeTab : ""}`}
          aria-pressed={activeTab === "south"}
          onClick={() => setActiveTab("south")}
        >
          South Indian
        </button>
      </div>

      {/* `fullscreen={false}` — same reasoning as ChartsContent/NorthIndian.jsx,
          where the full note lives. This tab renders its heading, description and
          charts progressively while `loading` stays true until the slowest of the
          eight Ashtakvarga queries above lands, and a fullscreen overlay
          (position: fixed, inset: 0, z-index 999999, no pointer-events: none)
          intercepted every tap on content that was already readable behind it. */}
      <PrimaryLoader isLoading={loading} fullscreen={false} />

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
                fontSize={20}
              />
            )
        )}
      </div>
    </div>
  );
};

export default AshtakvargaContent;
