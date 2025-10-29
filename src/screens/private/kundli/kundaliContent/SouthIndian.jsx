import React from "react";
import { motion } from "framer-motion";
import styles from "./KundaliContent.module.scss";
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
      render: (row) => (row.isRetro === "true" ? "R" : "--"),
    },
    {
      label: "Combust",
      key: "is_planet_set",
      render: (row) => (row.is_planet_set ? "C" : "--"),
    },
    { label: "Avastha", key: "planet_awastha" },
    { label: "House", key: "house" },
  ];


const SouthIndian = ({ data }) => {
  const planets = data?.planetData?.filter((p) => p?.name !== "Ascendant");
  const svgBirthUrl = data?.birthChart?.svg
    ? `data:image/svg+xml;base64,${btoa(data?.birthChart?.svg || "")}`
    : null;
  const svgNavamsaUrl = data?.navamasaChart?.svg
    ? `data:image/svg+xml;base64,${btoa(data?.navamasaChart?.svg || "")}`
    : null;

  return (
    <div>

        <div className={styles.mainContainer}>
        <div className={styles.grid}>
          {/* Lagna / Ascendant Chart */}
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl}  />

          {/* Navamsa Chart */}
          <DynamicChart title="Navamsa" src={svgNavamsaUrl}/>
        </div>

        {/* Planetary Table */}
        {planets?.length > 0 ? (
          <DynamicTable title="Planets" headers={planetaryHeaders} data={planets} />
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
      </div>
    </div>
  );
};

export default SouthIndian;
