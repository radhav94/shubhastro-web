// src/components/common/SwitchTabs.jsx
import React, { useState } from "react";
import styles from "./Switchtabs.module.scss";

/**
 * Reusable SwitchTabs Component
 * @param {Array} tabs - Array of { label: string, value: string, component: ReactNode }
 * @param {string} defaultTab - (optional) The tab value to select by default
 */
const SwitchTabs = ({ tabs = [], defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value);

  const handleSelect = (value) => {
    setActiveTab(value);
  };

  const ActiveComponent = tabs.find((tab) => tab.value === activeTab)?.component;

  return (
    <div className={styles.switchTabsContainer}>
      {/* Buttons */}
      <div className={styles.buttonGroup}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.toggleButton} ${
              activeTab === tab.value ? styles.active : ""
            }`}
            onClick={() => handleSelect(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className={styles.tabContent}>
        {ActiveComponent ? <ActiveComponent /> : <p>No content found</p>}
      </div>
    </div>
  );
};

export default SwitchTabs;
