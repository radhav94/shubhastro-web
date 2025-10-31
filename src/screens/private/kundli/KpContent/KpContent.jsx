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
  {label:"Planets",key:"planet_name"},
    {label:"Sign Lord",key:"sign_lord",render: (row) => row.sign_lord.slice(0,2)|| "--"},
    {label:"Star Lord",key:"nakshatra_lord",render: (row) => row.nakshatra_lord.slice(0,2)|| "--"},
    {label:"Sub Lord",key:"sub_lord",render: (row) => row.sub_lord.slice(0,2)|| "--"}  
];

const planetaryHeaders = [
    {label:"Planets",key:"planet_name"},
    {
      label: "Cusp",
      key: "house",
    },
    {label:"Sign",key:"sign"},
    {label:"Sign Lord",key:"sign_lord",render: (row) => row.sign_lord.slice(0,2)|| "--"},
    {label:"Star Lord",key:"nakshatra_lord",render: (row) => row.nakshatra_lord.slice(0,2)|| "--"},
    {label:"Sub Lord",key:"sub_lord",render: (row) => row.sub_lord.slice(0,2)|| "--"}  
  ];

const cuspHeaders = [
    {label:"Cusp", key:"planet_id", render: (row) => row.planet_id+1 || "--" },
    {label:"Degree", key:"degree",render: (row) => row.degree?.toFixed?.(2) || "--",},
    {label:"Sign",key:"sign"},
    {label:"Sign Lord",key:"sign_lord",render: (row) => row.sign_lord.slice(0,2)|| "--"},
    {label:"Star Lord",key:"nakshatra_lord",render: (row) => row.nakshatra_lord.slice(0,2)|| "--"},
    {label:"Sub Lord",key:"sub_lord",render: (row) => row.sub_lord.slice(0,2)|| "--"}  
  ];

const KpContent = ({ data }) => {
  const kpPlanets = data?.rulingPlanets;
  const svgChalitUrl = data?.chalitChart?.svg
    ? `data:image/svg+xml;base64,${btoa(data?.chalitChart?.svg || "")}`
    : null;

  return (
     
      <div className={styles.mainContainer}>
        <div className={styles.grid}>
          {/* Chalit Chart */}
          <DynamicChart title="Chalit Chart " src={svgChalitUrl}  />

          {/*  */}
          {kpPlanets?.length > 0 ? (
          <DynamicTable title="Ruling table" headers={rulingHeaders} data={kpPlanets.length>5?kpPlanets.slice(0,5):kpPlanets} />
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
        {kpPlanets?.length>0 ? (
          <DynamicTable title="Planets" headers={planetaryHeaders} data={kpPlanets} />
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
        {kpPlanets?.length > 0 ? (
          <DynamicTable title="Cusps" headers={cuspHeaders} data={kpPlanets} />
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
