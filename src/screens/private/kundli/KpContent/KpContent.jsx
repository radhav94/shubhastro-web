import React from "react";
import { motion } from "framer-motion";
import styles from "./KpContent.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import DynamicTable from "../../../../component/UI/table/kundli/DynamicTable";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const rulingHeaders = [
  { label: "Planet", key: "name" },
  { label: "Sign Lord", key: "signLord" },
  { label: "Star Lord", key: "starLord" },
  { label: "Sub Lord", key: "subLord" }
];

const planetaryHeaders = [
    {label:"Planets",key:"name"},
    {label:"Cusp",key:"cusp"},
    {label:"Sign",key:"sign"},
    {label:"Sign Lord",key:"signLord"},
    {label:"Star Lord",key:"starLord"},
    {label:"Sub Lord",key:"subLord"}  ];

const cuspHeaders = [
    {label:"Cusp", key:"cusp"},
    {label:"Degree", key:"degree"},
    {label:"Sign",key:"sign"},
    {label:"Sign Lord",key:"signLord"},
    {label:"Star Lord",key:"starLord"},
    {label:"Sub Lord",key:"subLord"}
  ];

const KpContent = ({ data }) => {
  console.group(data,"data")
  const planets = data?.planetData?.filter((p) => p?.name !== "Ascendant");
  const svgChalitUrl = data?.chalitChart?.svg
    ? `data:image/svg+xml;base64,${btoa(data?.chalitChart?.svg || "")}`
    : null;

  return (
     
      <div className={styles.mainContainer}>
        <div className={styles.grid}>
          {/* Chalit Chart */}
          <DynamicChart title="Chalit Chart " src={svgChalitUrl}  />

          {/*  */}
          {planets?.length > 0 ? (
          <DynamicTable title="Ruling table" headers={rulingHeaders} data={planets} />
        ) : (
          <motion.div
            className={styles.contentCard}
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
          >
            <p>No ruling planet data available.</p>
          </motion.div>
        )}
          
        </div>

        {/* Planetary Table */}
        {planets?.length > 0 ? (
          <DynamicTable title="Planetary Details" headers={planetaryHeaders} data={planets} />
        ) : (
          <motion.div
            className={styles.contentCard}
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
          >
            <p>No planetary data available.</p>
          </motion.div>
        )}
        {/* Cusp Table */}
        {planets?.length > 0 ? (
          <DynamicTable title="Cusps" headers={cuspHeaders} data={planets} />
        ) : (
          <motion.div
            className={styles.contentCard}
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
          >
            <p>No Cusp data available.</p>
          </motion.div>
        )}
      </div>
  );
};

export default KpContent;
