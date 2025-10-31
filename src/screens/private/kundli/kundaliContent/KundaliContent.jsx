import React from "react";
import { motion } from "framer-motion";
import styles from "./KundaliContent.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import NorthIndian from "./NorthIndian";
import SouthIndian from "./SouthIndian";
import SwitchTabs from "../../../../component/UI/tabs/switchtabs/SwitchTabs";




const KundaliContent = ({ userData, data }) => {

  // const tabs = [
  //   { label: "North Indian", value: "north", component: () => <NorthIndian data={data} /> },
  //   { label: "South Indian", value: "south", component: () => <SouthIndian data={data} /> },
  // ];

  return (
    <div>
      <div className="flex mb-4">
        <PrimaryText isSemiBold size_20 color={appColors.tri}>
          {userData?.name || "--"}
        </PrimaryText>
        <div className="mr-2 ml-2" />
        <PrimaryText isSemiBold size_20 color={appColors.tri}>
          ({userData?.day || "--"} - {userData?.month || "--"} -{" "}
          {userData?.year || "--"})
        </PrimaryText>
      </div>
      <div className={styles.mainContainer}>
      {/* <SwitchTabs tabs={tabs} defaultTab="north" /> */}
      <NorthIndian data={data} />

    </div>
    </div>
  );
};

export default KundaliContent;
