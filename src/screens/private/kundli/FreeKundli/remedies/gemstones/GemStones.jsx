import React from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetGemStoneReportQuery } from "../../../../../../redux/api/kundli/planetApi";
import PrimaryLoader from "../../../../../../component/UI/PrimaryLoader";
import GemStoneCard from "./GemStoneCard";
import { buildVedicParam } from "../../../../../../utils/VedicParams.js/vedicParams";

const GemStones = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData ? buildVedicParam(formData) : skipToken;

  const { data, isLoading } = useGetGemStoneReportQuery(queryArgs);
  const gem = data?.response;

  return (
    <div>
      {isLoading && <PrimaryLoader isLoading={isLoading} />}

      {!isLoading && gem && <GemStoneCard gem={gem} />}
    </div>
  );
};

export default GemStones;
