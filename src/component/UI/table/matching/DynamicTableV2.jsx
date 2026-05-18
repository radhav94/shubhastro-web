import React from "react";
import TTSButton from "../../../UI/TTSButton";

const DynamicTable = ({data}) => {
  // Convert nested objects (like varna, vasya, etc.) into an array
  const rows = Object.keys(data)
    .filter((key) => typeof data[key] === "object" && data[key] !== null)
    .map((key) => data[key]);
  return (
    <>
        {rows.map((item, index) => {
          const cardText = `${item.name}. Score: ${item?.varna ?? 0} out of ${item?.full_score ?? 0}. Male: ${item?.boy_varna || ''}. Female: ${item?.girl_varna || ''}. ${item?.description || ''}`;
          return (
          <div
          key={index}
          className="bg-white rounded-xl shadow p-4 md:p-8 text-center relative"
        >
          {/* TTS Button */}
          <div className="absolute top-3 right-3">
            <TTSButton text={cardText} />
          </div>

          {/* HEADER SECTION */}
          <div className="border-b border-gray-300 pb-2 mb-2">
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
          );
        })}
    </>
  );
};

export default DynamicTable;
