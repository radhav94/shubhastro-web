// src/components/common/SwitchTabs.jsx
import { useRef, useState } from "react";
import styles from "./Switchtabs.module.scss";

/**
 * Reusable SwitchTabs Component
 * @param {Array} tabs - Array of { label: string, value: string, component: ReactNode }
 * @param {string} defaultTab - (optional) The tab value to select by default
 */
const SwitchTabs = ({ tabs = [], defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value);
  const contentRef = useRef(null);

  /*
    Re-tapping the tab you are already on.

    `setActiveTab(sameValue)` is a no-op: no state change, no re-render, nothing
    moves. On a phone this strip is a horizontally scrolled row of five dosha
    tabs (Manglik, Kaal Sarp, Mangal, Pitra, Sade Sati) sitting above a long
    report, so the pill for the section you are reading is right under your thumb
    and gets tapped again — to re-read it, or because the first tap's outcome
    scrolled out of view. That tap did nothing at all.

    A Clarity session shows the pattern: an Instagram in-app visitor spent
    sixteen minutes and 36 clicks inside one kundli report, working through Kaal
    Sarp, Mangal and Pitra in the last stretch.

    Deliberately not `disabled` on the active tab — a disabled button fires no
    event, which is the same silence with worse semantics, and this codebase has
    been moving away from it. A re-tap means "show me this section", so bring the
    content back into view. That is a real, visible response and it is useful:
    the panel starts below the strip and the report runs for several screens.
  */
  const handleSelect = (value) => {
    if (value === activeTab) {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setActiveTab(value);
  };

  const ActiveComponent = tabs.find((tab) => tab.value === activeTab)?.component;

  return (
    <>
      {/* Buttons - Outside any container */}
      <div className={styles.buttonGroup} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            className={`${styles.toggleButton} ${
              activeTab === tab.value ? styles.active : ""
            }`}
            onClick={() => handleSelect(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content - Separate container */}
      <div className={styles.tabContent} ref={contentRef} role="tabpanel">
        {ActiveComponent ? <ActiveComponent /> : <p>No content found</p>}
      </div>
    </>
  );
};

export default SwitchTabs;
