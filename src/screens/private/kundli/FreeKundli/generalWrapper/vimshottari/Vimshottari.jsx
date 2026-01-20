import React from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetVimshottariQuery } from "../../../../../../redux/api/kundli/planetApi";
import PrimaryLoader from "../../../../../../component/UI/PrimaryLoader";
import VimshottariCard from "./VimshottariCard";

const Vimshottari = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData
    ? {
      dob: `${String(formData.day).padStart(2, "0")}/${String(
        formData.month
      ).padStart(2, "0")}/${formData.year}`,
      tob: `${String(formData.hour).padStart(2, "0")}:${String(
        formData.min
      ).padStart(2, "0")}`,
      lat: formData.lat,
      lon: formData.lon,
      tz: formData.tzone,
      lang: "en",
    }
    : skipToken;

  const { data, isLoading } = useGetVimshottariQuery(queryArgs);
  const vimshottariData = data?.response?.dashas || [];

  return (
    <div style={{ padding: '1rem' }}>
      {isLoading && <PrimaryLoader isLoading={isLoading} />}

      {vimshottariData.map((dasha, index) => (
        <VimshottariCard key={index} dasha={dasha} />
      ))}
    </div>
  );
};

export default Vimshottari;
