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
          type="button"
          className={`${styles.tabButton} ${activeTab === "north" ? styles.activeTab : ""}`}
          aria-pressed={activeTab === "north"}
          onClick={() => setActiveTab("north")}
        >
          North Indian
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "south" ? styles.activeTab : ""}`}
          aria-pressed={activeTab === "south"}
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
