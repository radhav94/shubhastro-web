import React, { useState } from "react";
import styles from "./MallHistoryContent.module.scss";
import OrderHistoryTab from "./components/OrderHistoryTab";
import AddressesTab from "./components/AddressesTab";

const subTabs = ["Order History", "Addresses"];

const MallHistoryContent = () => {
  const [activeSubTab, setActiveSubTab] = useState("Order History");

  return (
    <div className={styles.wrapper}>
      <div className={styles.subTabs}>
        {subTabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.subTab} ${activeSubTab === tab ? styles.active : ""}`}
            onClick={() => setActiveSubTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeSubTab === "Order History" ? (
          <OrderHistoryTab />
        ) : (
          <AddressesTab />
        )}
      </div>
    </div>
  );
};

export default MallHistoryContent;
