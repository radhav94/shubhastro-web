import React from "react";
import NorthIndian from "./NorthIndian";
import SouthIndian from "./SouthIndian";
import styles from "./ChartsContent.module.scss";
import SwitchTabs from "../../../../component/UI/tabs/switchtabs/SwitchTabs";
import { useSelector } from "react-redux";
import { useGetChartQuery } from "../../../../redux/api/kundli/kundliApi";

const ChartsContent = () => {
  const tabs = [
    { label: "North Indian", value: "north", component: () => <NorthIndian /> },
    { label: "South Indian", value: "south", component: () => <SouthIndian /> },
  ];

  return (
    <div className={styles.mainContainer}>
      {/* <SwitchTabs tabs={tabs} defaultTab="north" /> */}
      <NorthIndian />
    </div>
  );
};

export default ChartsContent;
