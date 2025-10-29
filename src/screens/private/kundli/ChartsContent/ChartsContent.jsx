import React from "react";
import NorthIndian from "./NorthIndian";
import SouthIndian from "./SouthIndian";
import styles from "./ChartsContent.module.scss";
import SwitchTabs from "../../../../component/UI/tabs/switchtabs/SwitchTabs";

const ChartsContent = ({ data }) => {
  const tabs = [
    { label: "North Indian", value: "north", component: () => <NorthIndian data={data} /> },
    { label: "South Indian", value: "south", component: () => <SouthIndian data={data} /> },
  ];

  return (
    <div className={styles.mainContainer}>
      <SwitchTabs tabs={tabs} defaultTab="north" />
    </div>
  );
};

export default ChartsContent;
