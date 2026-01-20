import React from "react";
import styles from "./Table.module.scss";

const Table = ({ sadeSatiTableData = [] }) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.dashaTable}>
        <thead>
          <tr>
            <th>Start</th>
            <th>End</th>
            <th>Sign Name</th>
            <th>Type</th>
            <th>Dhaiya</th>
            <th>Direction</th>
          </tr>
        </thead>
        <tbody>
          {sadeSatiTableData.length > 0 ? (
            sadeSatiTableData.map((row, idx) => (
              <tr key={idx}>
                <td>{formatDate(row.start_date)}</td>
                <td>{formatDate(row.end_date)}</td>
                <td>{row.zodiac || "-"}</td>
                <td>{row.type || "-"}</td>
                <td>{row.dhaiya || "-"}</td>
                <td>{row.direction || "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Helper functions ---

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const [day, month, rest] = dateStr.split("-");
    const [year] = rest.split(" ");
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  } catch {
    return dateStr;
  }
};

export default Table