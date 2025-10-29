import styles from './DynamicTable.module.scss'
import { motion } from "framer-motion";


const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};


/**
 * Reusable Dynamic Table Component
 * 
 * @param {string} title - Title for the table
 * @param {Array<string>} headers - List of column headers
 * @param {Array<Object>} data - Array of row data (each row is an object)
 * @param {string} keyField - Optional unique key field for each row
 */
const DynamicTable = ({ title, headers = [], data = [], keyField }) => {
  return (
    <motion.div
      className={styles.contentCard}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {title && <h3 className={styles.cardTitle}>{title}</h3>}

      <div className={styles.tableContainer}>
        <table className={styles.detailsTable}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h.label || h}>{h.label || h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data?.length > 0 ? (
              data.map((row, index) => (
                <tr key={keyField ? row[keyField] : index}>
                  {headers.map((h) => {
                    const key = h.key || h;
                    const content = h.render
                      ? h.render(row) // use custom renderer if available
                      : row[key];
                    return (
                      <td key={key}>
                        {content !== undefined && content !== null
                          ? content
                          : "--"}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} style={{ textAlign: "center" }}>
                  No Data Available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};


export default DynamicTable;