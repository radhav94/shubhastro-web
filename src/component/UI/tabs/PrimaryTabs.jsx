import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useSearchParams } from "react-router-dom";
import styles from "./PrimaryTabs.module.scss";
import ConnectCard from "../cards/connectCard/ConnectCard";
import ServiceCards from "../../../screens/private/home/components/serviceCards/ServiceCards";
import ZodiacCarousel from "../../../screens/private/horoscope/zodiacCarousel/ZodiacCarousel";

const PrimaryTabs = ({ tabs = [], initialActiveIndex = 0 }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTabIndex, setActiveTabIndex] = useState(initialActiveIndex);

  // Sync activeTabIndex with initialActiveIndex when it changes
  // useEffect(() => {
  //   setActiveTabIndex(initialActiveIndex);
  // }, [initialActiveIndex]);

  if (tabs.length === 0) {
    return <div>No tabs to display.</div>;
  }
  
  const { kundliId } = useParams();

  const activeStyle = {
    display: "none",
    background: "black",
  };

  const handleTabClick = (index) => {
    setActiveTabIndex(index);
    
    // If clicking on "Free Report" tab (index 6), set subtab=generalInfo
    if (index === 6) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', 'free-report');
      newParams.set('subtab', 'generalInfo');
      console.log('PrimaryTabs: Setting tab and subtab parameters:', newParams.toString());
      setSearchParams(newParams, { replace: true });
    } else {
      // Remove subtab parameter for other tabs
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('subtab');
      newParams.delete('tab');
      setSearchParams(newParams, { replace: true });
    }
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
            onClick={() => handleTabClick(index)}
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
