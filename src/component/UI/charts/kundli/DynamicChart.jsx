import styles from "./DynamicChart.module.scss";
import { motion } from "framer-motion";

const updateSvgFontSize = (dataUri, newSize = 12) => {
  if (!dataUri.startsWith("data:image/svg+xml")) return dataUri;

  const svgText = decodeURIComponent(dataUri.split(",")[1]);

  const updatedSvg = svgText.replace(
    /font-size:\s*\d+(\.\d+)?px/g,
    `font-size:${newSize}px`
  );

  return `data:image/svg+xml;utf8,${encodeURIComponent(updatedSvg)}`;
};

const sectionVariants = {
  hidden: { opacity: 0.6, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const DynamicChart = ({ title, src, fontSize = 8 }) => {
  if (!src) return null;

  const updatedSrc = updateSvgFontSize(src, fontSize);

  return (
    <motion.div
      className={styles.contentCard}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {title && <h3 className={styles.cardTitle}>{title}</h3>}

      <div className={styles.chartPlaceholder}>
        <img
          src={updatedSrc}
          alt={title || "Chart"}
          className={styles.chartImage}
        />
      </div>
    </motion.div>
  );
};

export default DynamicChart;
