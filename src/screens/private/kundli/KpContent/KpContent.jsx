import React, { useState } from "react";
import styles from "./KpContent.module.scss";
import DynamicTable from "../../../../component/UI/table/kundli/DynamicTable";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import { useSelector } from "react-redux";
import {
  useGetChartQuery,
  useGetKpDetailsQuery,
} from "../../../../redux/api/kundli/kundliApi";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import { sanitizeSvg } from "../../../../utils/helper/sanitizeSvg";
import useLang from "../../../../utils/hooks/useLang";

function decimalToDMS(decimal) {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return "-";
  }

  const degrees = Math.floor(decimal);
  const minutesFloat = (decimal - degrees) * 60;
  const minutes = Math.round(minutesFloat);

  return `${degrees}° ${minutes}′`;
}

const rulingHeaders = [
  { label: "Planets", key: "planet_name" },
  {
    label: "Sign Lord",
    key: "sign_lord",
    render: (row) => row.sign_lord?.slice(0, 2) || "--",
  },
  {
    label: "Star Lord",
    key: "nakshatra_lord",
    render: (row) => row.nakshatra_lord?.slice(0, 2) || "--",
  },
  {
    label: "Sub Lord",
    key: "sub_lord",
    render: (row) => row.sub_lord?.slice(0, 2) || "--",
  },
];

const planetaryHeaders = [
  { label: "Planet", key: "full_name" },
  { label: "Cusp", key: "house" },
  { label: "Sign", key: "zodiac" },
  {
    label: "Sign Lord",
    key: "pseudo_rasi_lord",
    render: (row) => row.pseudo_rasi_lord || "--",
  },
  {
    label: "Star Lord",
    key: "pseudo_nakshatra_lord",
    render: (row) => row.pseudo_nakshatra_lord || "--",
  },
  {
    label: "Sub Lord",
    key: "sub_lord",
    render: (row) => row.sub_lord || "--",
  },
  {
    label: "Sub-Sub Lord",
    key: "sub_sub_lord",
    render: (row) => row.sub_sub_lord || "--",
  },
  {
    label: "Degree",
    key: "local_degree",
    render: (row) => decimalToDMS(row.local_degree),
  },
  {
    label: "Retro",
    key: "retro",
    render: (row) =>
      row.retro === true ? "Retro" : row.retro === false ? "Direct" : "-",
  },
];

const cuspHeaders = [
  {
    label: "Cusp",
    key: "planet_id",
    render: (row) => row.planet_id + 1 || "--",
  },
  {
    label: "Degree",
    key: "degree",
    render: (row) => row.degree?.toFixed?.(2) || "--",
  },
  { label: "Sign", key: "sign" },
  {
    label: "Sign Lord",
    key: "sign_lord",
    render: (row) => row.sign_lord?.slice(0, 2) || "--",
  },
  {
    label: "Star Lord",
    key: "nakshatra_lord",
    render: (row) => row.nakshatra_lord?.slice(0, 2) || "--",
  },
  {
    label: "Sub Lord",
    key: "sub_lord",
    render: (row) => row.sub_lord?.slice(0, 2) || "--",
  },
];

const KpContent = () => {
  const [activeTab, setActiveTab] = useState("north");
  const payload = useSelector((state) => state?.form?.kundliPayload);
  const lang = useLang();
  const params = payload ? buildVedicParam(payload, { style: activeTab, lang }) : null;

  const { data, isLoading: kpLoading } = useGetKpDetailsQuery(
    params ? params : skipToken
  );
  const { data: chalitChart, isLoading: chalitLoading } = useGetChartQuery(
    params ? { chartType: "kp_chalit", params } : skipToken
  );

  const kpPlanets = data?.response
    ? Object.values(data.response).filter((item) => typeof item === "object")
    : [];

  const svgChalitUrl = sanitizeSvg(chalitChart) || null;

  return (
    <div className={styles.mainContainer}>
      {/* North/South Tab Switcher */}
      <div className={styles.tabGroup}>
        <button
          className={`${styles.tabButton} ${activeTab === "north" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("north")}
        >
          North Indian
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "south" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("south")}
        >
          South Indian
        </button>
      </div>

      <PrimaryLoader isLoading={chalitLoading} />
      <div className={styles.grid}>
        {/* Chalit Chart */}
        <DynamicChart title="Bhav Chalit Chart" src={svgChalitUrl} />
      </div>

      {/* Planetary Table */}
      {kpPlanets?.length > 0 && (
        <DynamicTable
          title="Planets"
          headers={planetaryHeaders}
          data={kpPlanets}
        />
      )}
    </div>
  );
};

export default KpContent;
