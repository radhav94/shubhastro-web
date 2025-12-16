import styles from './DynamicChart.module.scss'
import { motion } from "framer-motion";

const sectionVariants = {
  hidden: { opacity: 0.6, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const DynamicChart = ({ title, src }) => {
  if (!src) return null;

  return (
    <motion.div
      className={styles.contentCard}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {title && <h3 className={styles.cardTitle}>{title}</h3>}

      <div
        className={styles.chartPlaceholder}
        dangerouslySetInnerHTML={{ __html: src }}
      />
    </motion.div>
  );
};

export default DynamicChart;
