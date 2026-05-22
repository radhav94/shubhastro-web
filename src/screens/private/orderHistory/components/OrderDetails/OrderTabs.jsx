import React, { useRef, useEffect } from "react";
import styles from "./OrderTabs.module.scss";
import { isShubhMallEnabled } from "../../../../../utils/featureConfig";

const OrderTabs = ({ activeTab, onTabChange }) => {
  const tabs = ["Call", "Chat", "Video", ...(isShubhMallEnabled() ? ["Remedies"] : [])];
  const tabsRef = useRef(null);
  const activeTabRef = useRef(null);

  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const tabsContainer = tabsRef.current;
      const activeTabElement = activeTabRef.current;
      const containerWidth = tabsContainer.offsetWidth;
      const tabLeft = activeTabElement.offsetLeft;
      const tabWidth = activeTabElement.offsetWidth;
      const scrollLeft = tabLeft - containerWidth / 2 + tabWidth / 2;

      tabsContainer.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsWrapper} ref={tabsRef}>
        {tabs.map((tab) => (
          <button
            key={tab}
            ref={activeTab === tab ? activeTabRef : null}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrderTabs;
