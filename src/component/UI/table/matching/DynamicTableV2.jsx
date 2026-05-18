import React from "react";
import styles from "./RenderCard.module.scss";

const DynamicTable = ({data}) => {
  // Convert nested objects (like varna, vasya, etc.) into an array
  const rows = Object.keys(data)
    .filter((key) => typeof data[key] === "object" && data[key] !== null)
    .map((key) => data[key]);
  return (
    <>
      {/* {title && (
        <h2 className="text-xl font-semibold text-start  p-3 ">{title}</h2>
      )} */}
        {rows.map((item, index) => (
          <div
          key={index}
          className={styles.dyCard}
        >
          {/* HEADER SECTION */}
          <div className={styles.dyCardInner}>
            <div className="text-m md:text-xl text-black-900 mb-1">
              {item.name}
            </div>
        
            <div className="text-xl md:text-4xl font-bold text-[#FF6A3D] notranslate" translate="no">
              {(item?.varna ?? "-")}/{(item?.full_score ?? "-")}
            </div>
          </div>
        
          {/* DETAILS */}
          <div className="text-xs text-gray-700 md:text-base  md:text-gray-700 text-left space-y-1 md:space-y-2 md:leading-relaxed">
            <div>
              <strong className="md:font-semibold">Male :</strong> {item?.boy_varna}
            </div>
            <div>
              <strong className="md:font-semibold">Female :</strong> {item?.girl_varna}
            </div>
            <div>
              <strong className="md:font-semibold">Description :</strong> {item?.description}
            </div>
          </div>
        </div>
        ))}
    </>
  );
};

export default DynamicTable;
