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

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

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
  { label: "Planets", key: "planet_name" },
  { label: "Cusp", key: "house" },
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
  let kpPlanets;
  // const {
  //   data: kpPlanets,
  //   isSuccess,
  //   isLoading,
  // } = useGetKpDetailsQuery(payload ? { payload } : skipToken);
  const { data: chalitChart, isLoading: chalitLoading } = useGetChartQuery(
    payload ? { chartType: "chalit", payload } : skipToken
  );
  const svgChalitUrl = chalitChart
    ? `data:image/svg+xml;base64,${btoa(chalitChart || "")}`
    : null;

  return (
    <div className={styles.mainContainer}>
      <PrimaryLoader isLoading={chalitLoading} />
      <div className={styles.grid}>
        {/* Left: Chalit Chart */}
        <DynamicChart title="Chalit Chart" src={svgChalitUrl} />

        {/* Right: Ruling Table */}
        {kpPlanets?.length > 0 && (
          <DynamicTable
            title="Ruling Table"
            headers={rulingHeaders}
            data={kpPlanets.length > 5 ? kpPlanets.slice(0, 5) : kpPlanets}
          />
        )}
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
      {kpPlanets?.length > 0 && (
        <DynamicTable title="Cusps" headers={cuspHeaders} data={kpPlanets} />
      )}
    </div>
  );
};

export default KpContent;
