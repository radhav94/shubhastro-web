import React from "react";
import { motion } from "framer-motion";
import styles from "./KundaliContent.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import NorthIndian from "./NorthIndian";
import SouthIndian from "./SouthIndian";
import SwitchTabs from "../../../../component/UI/tabs/switchtabs/SwitchTabs";
import { useSelector } from "react-redux";
import { useGetPlanetsQuery } from "../../../../redux/api/kundli/kundliApi";
import { skipToken } from "@reduxjs/toolkit/query";

const KundaliContent = () => {
  const userDetails = useSelector((state) => state?.form?.userDetails);

  // const tabs = [
  //   { label: "North Indian", value: "north", component: () => <NorthIndian data={data} /> },
  //   { label: "South Indian", value: "south", component: () => <SouthIndian data={data} /> },
  // ];

  return (
    <div>
      {userDetails && (
        <div className="flex mb-4">
          <PrimaryText isSemiBold size_20 color={appColors.tri}>
            {userDetails?.name || "--"}
          </PrimaryText>
          <div className="mr-2 ml-2" />
          <PrimaryText isSemiBold size_20 color={appColors.tri}>
            ({userDetails?.day || "--"} - {userDetails?.month || "--"} -{" "}
            {userDetails?.year || "--"})
          </PrimaryText>
        </div>
      )}
      <div className={styles.mainContainer}>
        {/* <SwitchTabs tabs={tabs} defaultTab="north" /> */}
        <NorthIndian />
      </div>
    </div>
  );
};

export default KundaliContent;
