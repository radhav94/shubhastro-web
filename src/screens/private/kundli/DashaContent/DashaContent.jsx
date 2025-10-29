import React from "react";
import styles from "./DashaContent.module.scss";
import SwitchTabs from "../../../../component/UI/tabs/switchtabs/SwitchTabs";
import Vimshottari from "./Vimshottari";
import Yogini from "./Yogini";

const DashaContent = ({ data }) => {
  const tabs = [
    { label: "Vimshottari", value: "vimshottari", component: () => <Vimshottari data={data} /> },
    { label: "Yogini", value: "yogini", component: () => <Yogini data={data} /> },
  ];

  return (
    <div className={styles.mainContainer}>
      <SwitchTabs tabs={tabs} defaultTab="vimshottari" />
    </div>
  );
};

export default DashaContent;
