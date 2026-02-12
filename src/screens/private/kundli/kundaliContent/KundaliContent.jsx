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

const monthToNumber = (month) => {
  if (!month) return "00";
  
  const monthMap = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12"
  };
  
  const monthStr = String(month).toLowerCase().trim();
  return monthMap[monthStr] || String(month).padStart(2, "0");
};

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
            ({String(userDetails?.day).padStart(2, "0")} - {monthToNumber(userDetails?.month)} - {userDetails?.year})
            {/* ({userDetails?.day || "--"} - {userDetails?.month || "--"} -{" "}
            {userDetails?.year || "--"}) */}
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
