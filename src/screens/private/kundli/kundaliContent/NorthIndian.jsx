import React from "react";
import { motion } from "framer-motion";
import styles from "./KundaliContent.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import DynamicTable from "../../../../component/UI/table/kundli/DynamicTable";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import {
  useGetChartQuery,
  useGetPlanetsQuery,
} from "../../../../redux/api/kundli/kundliApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSelector } from "react-redux";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const planetaryHeaders = [
  { label: "Planet", key: "name" },
  { label: "Sign", key: "sign" },
  { label: "Sign Lord", key: "signLord" },
  { label: "Nakshatra", key: "nakshatra" },
  { label: "Naksh Lord", key: "nakshatraLord" },
  {
    label: "Degree",
    key: "normDegree",
    render: (row) => row.normDegree?.toFixed?.(2) || "--",
  },
  {
    label: "Retro(R)",
    key: "isRetro",
  },
  {
    label: "Combust",
    key: "is_planet_set",
    render: (row) => (row.is_planet_set ? "Yes" : "No"),
  },
  { label: "Avastha", key: "planet_awastha" },
  { label: "House", key: "house" },
];

const NorthIndian = () => {
  const payload = useSelector((state) => state?.form?.kundliPayload);
  const { data, isSuccess, isLoading } = useGetPlanetsQuery(
    payload ? { payload } : skipToken
  );
  const planets = data?.filter((p) => p?.name !== "Ascendant");

  const chartTypes = ["D1", "D9"];
  const charts = chartTypes.map((type) =>
    useGetChartQuery(payload ? { chartType: type, payload } : skipToken)
  );

  const svgBirthUrl = charts[0]?.data?.svg
    ? `data:image/svg+xml;base64,${btoa(charts[0]?.data?.svg || "")}`
    : null;
  const svgNavamsaUrl = charts[1]?.data?.svg
    ? `data:image/svg+xml;base64,${btoa(charts[1]?.data?.svg || "")}`
    : null;

  return (
    <div>
      <div className={styles.mainContainer}>
        <div className={styles.grid}>
          {/* Lagna / Ascendant Chart */}
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />

          {/* Navamsa Chart */}
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
        </div>

        {/* Planetary Table */}
        {planets?.length > 0 && (
          <DynamicTable
            title="Planets"
            headers={planetaryHeaders}
            data={planets}
          />
        )}
      </div>
    </div>
  );
};

export default NorthIndian;
