import React from "react";
import styles from "./PanchangCard.module.scss";

/**
 * PanchangCard component
 * @param {string} title - Optional title for the card
 * @param {Array|Object} data - Data can be an array of { key, value, icon } or an object { key: value }
 */
const PanchangCard = ({ title, data, muhratData, summary }) => {
  if (!data || Object.keys(data).length === 0) return null;

  // Support both object and array formats
  const entries = Array.isArray(data)
    ? data.filter((item) => item?.value)
    : Object.entries(data)
        .map(([key, value]) => ({ key, value }))
        .filter((item) => Boolean(item.value));

  if (entries.length === 0) return null;

  return (
    <>
      {muhratData && (
        <div className="flex bg-white rounded-md shadow-sm w-full p-2 mt-3">
          <div className="bg-red-300 py-1  m-2 ml-4 rounded-md w-52 ">
            <h1 className="font-bold  text-lg ">
              {muhratData?.abhijit?.title}
            </h1>
            <span className="text-red-500">
              {muhratData?.abhijit?.start} - {muhratData?.abhijit?.end}
            </span>
          </div>
          <div className="bg-green-200 py-1 m-2 w-52 rounded-md ml-[31.5%]">
            <h1 className="font-bold  text-lg ">
              {muhratData?.rahukaal?.title}
            </h1>
            <span className="text-red-500">
              {muhratData?.rahukaal?.start} - {muhratData?.rahukaal?.end}
            </span>
          </div>
        </div>
      )}
      <div className={styles.card}>
        {title && <h3 className={styles.title}>{title}</h3>}

        <div className={styles.content}>
          {entries.map((item, index) => (
            <div className={styles.item} key={index}>
              <div className={styles.key}>
                {/* Render icon only if provided */}
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span>{item.key}</span>
              </div>
              <div className={styles.value}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PanchangCard;
