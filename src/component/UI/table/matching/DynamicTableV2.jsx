import React from "react";

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
          className="bg-white rounded-xl shadow p-4 text-center"
        >
          {/* HEADER SECTION */}
          <div className="border-b border-gray-300 pb-2 mb-2">
            <div className="text-m text-black-900 mb-1">
              {item.name}
            </div>
        
            <div className="text-xl font-bold text-[#FF6A3D]">
              {(item?.varna ?? "-")}/{(item?.full_score ?? "-")}
            </div>
          </div>
        
          {/* DETAILS */}
          <div className="text-xs text-gray-400 text-left space-y-1">
            <div>
              <strong>Male :</strong> {item?.boy_varna}
            </div>
            <div>
              <strong>Female :</strong> {item?.girl_varna}
            </div>
            <div>
              <strong>Description :</strong> {item?.description}
            </div>
          </div>
        </div>
        ))}
    </>
  );
};

export default DynamicTable;
