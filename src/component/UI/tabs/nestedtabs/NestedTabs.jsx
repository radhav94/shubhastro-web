import React, { useState, useEffect } from "react";
import styles from "./NestedTabs.module.scss";

/**
 * Simplified Nested Tabs
 * - Always shows the first tab when mounted or when parent re-renders
 * - Supports different styles for outer and inner tabs
 */
const NestedTabs = ({ tabs = [] }) => {
  const [outerActive, setOuterActive] = useState(tabs[0]?.value || "");
  const [innerActive, setInnerActive] = useState(
    tabs[0]?.children?.[0]?.value || ""
  );

  // Reset to first tab whenever parent sends new `tabs`
  useEffect(() => {
    if (tabs?.length > 0) {
      setOuterActive(tabs[0].value);
      setInnerActive(tabs[0]?.children?.[0]?.value || "");
    }
  }, [tabs]);

  const handleOuterSelect = (value) => {
    setOuterActive(value);
    const selected = tabs.find((t) => t.value === value);
    setInnerActive(selected?.children?.[0]?.value || "");
  };

  const handleInnerSelect = (value) => {
    setInnerActive(value);
  };

  const outerTab = tabs.find((t) => t.value === outerActive);
  const innerTabs = outerTab?.children || [];
  const activeInnerTab = innerTabs.find((t) => t.value === innerActive);

  return (
    <div className={styles.nestedTabsContainer}>
      {/* OUTER TABS */}
      <div className={styles.outerButtonGroup}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.outerButton} ${outerActive === tab.value ? styles.activeOuter : ""
              }`}
            onClick={() => handleOuterSelect(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* INNER TABS */}
      {innerTabs.length > 0 && (
        <div className={styles.innerButtonGroup}>
          {innerTabs.map((inner) => (
            <button
              key={inner.value}
              className={`${styles.innerButton} ${innerActive === inner.value ? styles.activeInner : ""
                }`}
              onClick={() => handleInnerSelect(inner.value)}
            >
              {inner.label}
            </button>
          ))}
        </div>
      )}

      {/* CASE 2: No children but parent has component → Render parent component (buttons outside innerTabContent) */}
      {innerTabs.length === 0 && outerTab?.component && (
        <outerTab.component />
      )}

      {/* CONTENT AREA */}
      <div className={styles.innerTabContent}>
        {/* CASE 1: Has children → Render inner component */}
        {innerTabs.length > 0 && activeInnerTab?.component && (
          <activeInnerTab.component />
        )}

        {/* CASE 3: Nothing to show */}
        {innerTabs.length === 0 && !outerTab?.component && (
          <p>No content available</p>
        )}
      </div>

    </div>
  );
};

export default NestedTabs;
