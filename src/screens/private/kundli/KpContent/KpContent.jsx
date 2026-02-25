import React from "react";
import { motion } from "framer-motion";
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

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

function decimalToDMS(decimal) {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return "-";
  }

  const degrees = Math.floor(decimal);
  const minutesFloat = (decimal - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);

  return `${degrees}° ${minutes}′ ${seconds}″`;
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
    render: (row) => row.retro === true ? "Retro" : row.retro === false ? "Direct" : "-",
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
  const payload = useSelector((state) => state?.form?.kundliPayload);
  const params = payload ? buildVedicParam(payload) : null;
  const { data, isSuccess, isLoading } = useGetKpDetailsQuery(
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
      <PrimaryLoader isLoading={chalitLoading} />
      <div className={styles.grid}>
        {/* Left: Chalit Chart */}
        <DynamicChart title="Bhav Chalit Chart" src={svgChalitUrl} />

        {/* Right: Ruling Table */}
        {/* {kpPlanets?.length > 0 && (
          <DynamicTable
            title="Ruling Table"
            headers={rulingHeaders}
            data={kpPlanets.length > 5 ? kpPlanets.slice(0, 5) : kpPlanets}
          />
        )} */}
      </div>

      {/* Planetary Table */}
      {kpPlanets?.length > 0 && (
        <DynamicTable
          title="Planets"
          headers={planetaryHeaders}
          data={kpPlanets}
        />
      )}

      {/* Cusp Table */}
      {/* {kpPlanets?.length > 0 && (
        <DynamicTable title="Cusps" headers={cuspHeaders} data={kpPlanets} />
      )} */}
    </div>
  );
};

export default KpContent;
