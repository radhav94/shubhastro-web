import React from "react";
import styles from "./DashaContent.module.scss";
import SwitchTabs from "../../../../component/UI/tabs/switchtabs/SwitchTabs";
import Vimshottari from "./Vimshottari";
import Yogini from "./Yogini";

const DashaContent = () => {
  const tabs = [
    {
      label: "Vimshottari",
      value: "vimshottari",
      component: () => <Vimshottari />,
    },
    {
      label: "Yogini",
      value: "yogini",
      component: () => <Yogini />,
    },
  ];

  return (
    <div className={styles.mainContainer}>
      {/* <SwitchTabs tabs={tabs} defaultTab="vimshottari" /> */}
      <Vimshottari />
    </div>
  );
};

export default DashaContent;
