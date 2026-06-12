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
      <p style={{ 
        fontSize: '16px', 
        color: '#070707ff', 
        background: 'rgba(255, 255, 255, 0.4)', 
        padding: '10px 14px', 
        borderRadius: '8px', 
        marginBottom: '16px',
        lineHeight: '1.5',
      }}>
        We recommend consulting a verified astrologer before purchasing any gemstone to ensure it aligns with your specific planetary positions.
      </p>

      {isLoading && <PrimaryLoader isLoading={isLoading} />}

      {!isLoading && gem && <GemStoneCard gem={gem} />}
    </div>
  );
};

export default GemStones;
