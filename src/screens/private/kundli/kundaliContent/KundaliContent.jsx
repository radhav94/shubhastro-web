import React, { useState } from "react";
import styles from "./KundaliContent.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import NorthIndian from "./NorthIndian";
import SouthIndian from "./SouthIndian";
import { useSelector } from "react-redux";

const monthToNumber = (month) => {
  if (!month) return "00";
  
  const monthMap = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12"
  };
  
  const monthStr = String(month).toLowerCase().trim();
  return monthMap[monthStr] || String(month).padStart(2, "0");
};

const KundaliContent = () => {
  const [activeTab, setActiveTab] = useState("north");
  const userDetails = useSelector((state) => state?.form?.userDetails);

  return (
    <div>
      {userDetails && (
        <div className="flex mb-4">
          <PrimaryText isSemiBold size_20 color={appColors.tri}>
            {userDetails?.name || "--"}
          </PrimaryText>
          <div className="mr-2 ml-2" />
          <PrimaryText isSemiBold size_20 color={appColors.tri}>
            ({String(userDetails?.day).padStart(2, "0")} - {monthToNumber(userDetails?.month)} - {userDetails?.year})
          </PrimaryText>
        </div>
      )}
      <div className={styles.mainContainer}>
        {/* North/South Tab Switcher */}
        <div className={styles.tabGroup}>
          <button
            className={`${styles.tabButton} ${activeTab === "north" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("north")}
          >
            North Indian
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "south" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("south")}
          >
            South Indian
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "north" && <NorthIndian style="north" />}
        {activeTab === "south" && <SouthIndian style="south" />}
      </div>
    </div>
  );
};

export default KundaliContent;
