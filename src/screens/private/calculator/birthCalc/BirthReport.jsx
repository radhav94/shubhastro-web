import React from "react";
import { motion } from "framer-motion";
import styles from "./BirthReport.module.scss";
import { appColors } from "../../../../utils/theme";
import DynamicTable from "../../../../component/UI/table/kundli/DynamicTable";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import {
  useGetChartQuery,
  useGetPlanetsQuery,
} from "../../../../redux/api/kundli/kundliApi";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { sanitizeSvg } from "../../../../utils/helper/sanitizeSvg";
import CalcBackButton from "../CalcBackButton";

export const planetaryHeaders = [
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
  {
    label: "Global Degree",
    key: "global_degree",
    render: (row) => row.global_degree || "--",
  },

  {
    label: "Progress %",
    key: "progress_percentage",
    render: (row) => row.progress_percentage || "--",
  },

  // Motion
  {
    label: "Retro",
    key: "retro",
    render: (row) => (row.retro === "Retro" ? "Retro" : "Direct"),
  },

  // Combust / Planet set
  {
    label: "Combust",
    key: "is_combust",
    render: (row) => (row.is_combust === "Yes" ? "Yes" : "No"),
  },

  {
    label: "Planet Set",
    key: "is_planet_set",
    render: (row) => (row.is_planet_set === "Yes" ? "Yes" : "No"),
  },

  // Additional details
  { label: "Avastha", key: "avastha" },
  { label: "Lord Status", key: "lord_status" },
  { label: "House", key: "house" },
];

export const buildAstroPayload = (data) => {
  if (!data) return null;

  const { dob, lat, lng, tob, isTimeUnknown } = data;

  // Convert YYYY-MM-DD → DD/MM/YYYY
  const formatDOB = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return {
    dob: formatDOB(dob),
    lang: "en",
    lat: Number(lat),
    lon: Number(lng),
    tob: isTimeUnknown ? "00:00" : tob,
    tz: 5.5,
  };
};

const BirthReport = () => {
  const payload = JSON.parse(localStorage.getItem("birth_natal_calc"));

  const params = payload ? buildAstroPayload(payload) : null;

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
      <CalcBackButton />
      <PrimaryLoader isLoading={loading} />

      {planetSuccess && birthSuccess && navSuccess && (
        <div className={styles.pageWrapper}>
          {/* NAME CARD */}
          <div className={styles.nameCard}>
            <h2>{payload?.name ? `${payload.name.toUpperCase()}'S BIRTH / NATAL REPORT` : "BIRTH / NATAL REPORT"}</h2>
            <div className={styles.headingUnderline}>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
                  <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
                </svg>
              </div>
              <span className={styles.dividerMoon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
                  <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303" />
                </svg>
              </span>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
                  <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.mainContainer}>
            {/* CHART GRID */}
            <div className={styles.chartGrid}>
              <DynamicChart
                title="Lagna / Ascendant Chart"
                src={sanitizeSvg(svgBirthUrl)}
              />

              <DynamicChart
                title="Navamsa Chart"
                src={sanitizeSvg(navamsaChart)}
              />
            </div>

            {/* PLANETARY TABLE */}
            {planetData?.length > 0 && (
              <div className={styles.tableWrapper}>
                <DynamicTable
                  title="Planetary Details"
                  headers={planetaryHeaders}
                  data={planetData}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BirthReport;

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

        local_degree: value.local_degree?.toFixed(2) || "-",
        global_degree: value.global_degree?.toFixed(2) || "-",
        progress_percentage: value.progress_in_percentage?.toFixed(2) || "-",

        retro: value.retro ? "Retro" : "Direct",
        is_planet_set: value.is_planet_set ? "Yes" : "No",
        is_combust: value.is_combust ? "Yes" : "No",

        avastha: value.basic_avastha || "-",
        lord_status: value.lord_status || "-",
      });
    }
  });

  return planets;
}
