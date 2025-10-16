import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./PrimaryTabs.module.scss";
import PrimaryText from "../../PrimaryText";

const PrimaryTabs = ({ tabs = [] }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(
    tabs.length > 0 ? 0 : -1
  );

  if (activeTabIndex === -1) {
    return <div>No tabs to display.</div>;
  }

  return (
    <div className={styles.tabsContainer}>
      <nav className={styles.tabNav}>
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            className={`${styles.tabButton} ${
              activeTabIndex === index ? styles.active : ""
            }`}
            onClick={() => setActiveTabIndex(index)}
          >
            {/* The active tab gets a sliding pill background */}
            {activeTabIndex === index && (
              <motion.div
                className={styles.activePill}
                layoutId="activeTabPill"
              />
            )}

            <span className={styles.labelText}>
              <PrimaryText
                isSemiBold
                size_16
                color={activeTabIndex === index ? "#1a1a1a" : "#555555"}
              >
                {tab.label}
              </PrimaryText>
            </span>
          </button>
        ))}
      </nav>

      <main className={styles.tabContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTabIndex}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tabs[activeTabIndex].content}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PrimaryTabs;
