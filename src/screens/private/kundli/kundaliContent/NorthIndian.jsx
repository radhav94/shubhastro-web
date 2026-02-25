import React from "react";
import { motion } from "framer-motion";
import styles from "./KundaliContent.module.scss";
import { appColors } from "../../../../utils/theme";
import DynamicTable from "../../../../component/UI/table/kundli/DynamicTable";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import AdditionalPlanetaryInfo from "./AdditionalPlanetaryInfo";
import {
  useGetChartQuery,
  useGetPlanetsQuery,
} from "../../../../redux/api/kundli/kundliApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSelector } from "react-redux";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import { sanitizeSvg } from "../../../../utils/helper/sanitizeSvg";

export const planetaryHeaders = [
  { label: "House", key: "house" },
  { label: "Planet", key: "name" },
  { label: "Sign", key: "zodiac" },
  { label: "Sign Lord", key: "zodiac_lord" },

  { label: "Nakshatra", key: "nakshatra" },
  { label: "Nakshatra Lord", key: "nakshatra_lord" },

  {
    label: "Pada",
    key: "nakshatra_pada",
    render: (row) => row.nakshatra_pada || "--",
  },

  // Degrees
  {
    label: "Local Degree",
    key: "local_degree",
    render: (row) => row.local_degree || "--",
  },
  // {
  //   label: "Global Degree",
  //   key: "global_degree",
  //   render: (row) => row.global_degree || "--",
  // },

  // {
  //   label: "Progress %",
  //   key: "progress_percentage",
  //   render: (row) => row.progress_percentage || "--",
  // },

  // Motion
  {
    label: "Retro",
    key: "retro",
    render: (row) => row.retro === "Retro" || row.retro === "Direct" ? row.retro : "-",
  },

  // Combust / Planet set
  // {
  //   label: "Combust",
  //   key: "is_combust",
  //   render: (row) => (row.is_combust === "Yes" ? "Yes" : "No"),
  // },

  // {
  //   label: "Planet Set",
  //   key: "is_planet_set",
  //   render: (row) => (row.is_planet_set === "Yes" ? "Yes" : "No"),
  // },

  // Additional details
  { label: "Avastha", key: "avastha" },
  { label: "Lord Status", key: "lord_status" },
];

const NorthIndian = () => {
  const payload = useSelector((state) => state?.form?.kundliPayload);

  const params = payload ? buildVedicParam(payload) : null;

  /** 🌟 Load Planet Data */
  const {
    data,
    isLoading: planetLoading,
    isSuccess: planetSuccess,
  } = useGetPlanetsQuery(params ? params : skipToken);

  const planetData = formatPlanetData(data?.response);

  /** 🌟 Load Charts Individually (NO loop, NO map) */
  const {
    data: birthChart,
    isLoading: birthLoading,
    isSuccess: birthSuccess,
  } = useGetChartQuery(params ? { chartType: "D1", params } : skipToken);

  const {
    data: navamsaChart,
    isLoading: navLoading,
    isSuccess: navSuccess,
  } = useGetChartQuery(params ? { chartType: "D9", params } : skipToken);

  const loading = planetLoading || birthLoading || navLoading;

  const svgBirthUrl = birthChart || null;

  const svgNavamsaUrl = navamsaChart
    ? `data:image/svg+xml;utf8,${encodeURIComponent(navamsaChart)}`
    : null;


  return (
    <div>
      <PrimaryLoader isLoading={loading} />

      {planetSuccess && birthSuccess && navSuccess && (
        <div className={styles.mainContainer}>
          <div className={styles.grid}>
            {/* D1: Lagna Chart */}
            <DynamicChart title="Lagna / Ascendant Chart" src={sanitizeSvg(svgBirthUrl)} />

            {/* D9: Navamsa */}
            <DynamicChart title="Navamsa Chart" src={sanitizeSvg(navamsaChart)} />
          </div>

          {/* Planetary Table */}
          {planetData?.length > 0 && (
            <DynamicTable
              title="Planetary Details"
              headers={planetaryHeaders}
              data={planetData}
            />
          )}


        </div>
      )}
    </div>
  );
};

export default NorthIndian;

export function formatPlanetData(rawResponse) {
  if (!rawResponse) return [];

  const planets = [];

  Object.entries(rawResponse).forEach(([key, value]) => {
    // Planet objects are numeric keys ("0" to "9")
    if (!isNaN(key)) {
      planets.push({
        name: value.full_name || value.name || "-",
        short_name: value.name || "-",
        zodiac: value.zodiac || "-",
        zodiac_lord: value.zodiac_lord || "-",
        house: value.house || "-",

        nakshatra: value.nakshatra || "-",
        nakshatra_lord: value.nakshatra_lord || "-",
        nakshatra_pada: value.nakshatra_pada || "-",

        local_degree: decimalToDMS(value.local_degree) || "-",
        global_degree: value.global_degree?.toFixed(2) || "-",
        progress_percentage: value.progress_in_percentage?.toFixed(2) || "-",

        retro: value.retro === true ? "Retro" : value.retro === false ? "Direct" : "-",
        is_planet_set: value.is_planet_set ? "Yes" : "No",
        is_combust: value.is_combust ? "Yes" : "No",

        avastha: value.basic_avastha || "-",
        lord_status: value.lord_status || "-",
      });
    }
  });

  return planets;
}

export function decimalToDMS(decimal) {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return "-";
  }

  const degrees = Math.floor(decimal);
  const minutesFloat = (decimal - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);

  return `${degrees}° ${minutes}′ ${seconds}″`;
}