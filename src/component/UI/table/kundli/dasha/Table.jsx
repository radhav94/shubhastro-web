import React from "react";
import styles from "./Table.module.scss";

const Table = ({ dashaData }) => {
  // Convert nested object to an array
  const rows = Object.entries(dashaData)
    .filter(([key, value]) => typeof value === "object")
    .map(([level, value]) => ({
      level: formatLevel(level),
      planet: value.dasha_name || "-",
      start: formatDate(value.start_date),
      end: formatDate(value.end_date),
      duration: value.duration || "-",
    }));

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.dashaTable}>
        <thead>
          <tr>
            {/* <th>Level</th> */}
            <th>Planet</th>
            <th>Start Date</th>
            <th>End Date</th>
            {/* <th>Duration</th> */}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {/* <td>{row.level}</td> */}
              <td>{row.planet}</td>
              <td>{row.start}</td>
              <td>{row.end}</td>
              {/* <td>{row.duration}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Helper functions ---
const formatLevel = (key) => {
  // Converts "major_dasha" → "Major Dasha"
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

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