import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./PrimaryTabs.module.scss";
import ConnectCard from "../cards/connectCard/ConnectCard";
import ServiceCards from "../../../screens/private/home/components/serviceCards/ServiceCards";
import ZodiacCarousel from "../../../screens/private/horoscope/zodiacCarousel/ZodiacCarousel";
import { useParams } from "react-router-dom";

const PrimaryTabs = ({ tabs = [], initialActiveIndex = 0 }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(
    tabs.length > 0 ? initialActiveIndex : -1
  );

  if (activeTabIndex === -1) {
    return <div>No tabs to display.</div>;
  }
  const { kundliId } = useParams();

  const activeStyle = {
    display: "none",
    background: "black",
  };

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
            {tab.label}
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
        <div className="mt-4" style={kundliId ? activeStyle : null}>
          <ConnectCard />
          <ServiceCards />
        </div>
      </main>
      <div style={kundliId ? activeStyle : null}>
        <ZodiacCarousel />
      </div>
    </div>
  );
};

export default PrimaryTabs;
