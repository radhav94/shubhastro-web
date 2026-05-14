import React, { useState } from "react";
import NorthIndian from "./NorthIndian";
import SouthIndian from "./SouthIndian";
import styles from "./ChartsContent.module.scss";

const ChartsContent = () => {
  const [activeTab, setActiveTab] = useState("north");

  return (
    <div className={styles.mainContainer}>
      {/* Tab Switcher */}
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
  );
};

export default ChartsContent;
