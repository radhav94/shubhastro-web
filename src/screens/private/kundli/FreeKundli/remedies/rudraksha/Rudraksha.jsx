import React from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetRudrakshaReportQuery } from "../../../../../../redux/api/kundli/planetApi";
import PrimaryLoader from "../../../../../../component/UI/PrimaryLoader";
import RudrakshaCard from "./RudrakshaCard";
import { buildVedicParam } from "../../../../../../utils/VedicParams.js/vedicParams";

const Rudraksha = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData ? buildVedicParam(formData) : skipToken;

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
