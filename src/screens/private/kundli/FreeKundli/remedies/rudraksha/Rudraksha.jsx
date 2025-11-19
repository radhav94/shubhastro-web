import React from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetRudrakshaReportQuery } from "../../../../../../redux/api/kundli/planetApi";
import PrimaryLoader from "../../../../../../component/UI/PrimaryLoader";
import RudrakshaCard from "./RudrakshaCard";

const Rudraksha = () => {
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

  const { data, isLoading } = useGetRudrakshaReportQuery(queryArgs);
  const rudrakshaData = data?.response;

  return (
    <div>
      {isLoading && <PrimaryLoader isLoading={isLoading} />}

      {!isLoading && rudrakshaData && (
        <RudrakshaCard data={rudrakshaData} />
      )}
    </div>
  );
};

export default Rudraksha;
