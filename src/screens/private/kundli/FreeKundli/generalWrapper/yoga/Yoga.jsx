import React from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetYogaReportQuery } from "../../../../../../redux/api/kundli/planetApi";
import PrimaryLoader from "../../../../../../component/UI/PrimaryLoader";

import YogaSummaryCard from "./YogaSummaryCard";
import YogaCard from "./YogaCard";

const Yoga = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData
    ? {
        dob: `${formData.day}/${formData.month}/${formData.year}`,
        tob: `${String(formData.hour).padStart(2, "0")}:${String(
          formData.min
        ).padStart(2, "0")}`,
        lat: formData.lat,
        lon: formData.lon,
        tz: formData.tzone,
        lang: "en",
      }
    : skipToken;

  const { data, isLoading } = useGetYogaReportQuery(queryArgs);

  const summary = data?.response; // summary values
  const yogaList = data?.response?.yogas_list || []; // list of yoga

  return (
    <div>
      {isLoading && <PrimaryLoader isLoading={isLoading} />}

      {/* Summary Card */}
      {/* {summary && <YogaSummaryCard summary={summary} />} */}

      {/* All Yoga Cards */}
      {yogaList.map((item, index) => (
        <YogaCard key={index} yoga={item} />
      ))}
    </div>
  );
};

export default Yoga;
