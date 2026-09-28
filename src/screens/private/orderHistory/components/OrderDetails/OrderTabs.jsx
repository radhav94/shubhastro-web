import React, { useRef, useEffect } from "react";
import styles from "./OrderTabs.module.scss";
import { isShubhMallEnabled } from "../../../../../utils/featureConfig";

const OrderTabs = ({ activeTab, onTabChange }) => {
  const tabs = ["Call", "Chat", /* "Video", */ ...(isShubhMallEnabled() ? ["Remedies"] : [])];
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
      {/* role="tablist" so the role="tab" buttons below are valid ARIA — a tab
          with no tablist parent is worse than no role at all. The active-tab
          re-tap is handled by the caller (see handleTabChange in
          OrderDetails.jsx), which owns the content ref. */}
      <div className={styles.tabsWrapper} ref={tabsRef} role="tablist" aria-label="Order history">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
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
