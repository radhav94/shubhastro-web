import styles from './DynamicChart.module.scss'
import { motion } from "framer-motion";

const sectionVariants = {
  hidden: { opacity: 0.6, y:5  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const DynamicChart = ({ title, src, alt="Astrological Chart" }) => {
    return (
    <div>
    {src && <motion.div
        className={styles.contentCard}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
    >
        {title && <h3 className={styles.cardTitle}>{title}</h3>}
        <div className={styles.chartPlaceholder}>
            {src && (
                <img src={src} alt={alt} />
            )}
        </div>
    </motion.div>}
    </div>

)}

export default DynamicChart