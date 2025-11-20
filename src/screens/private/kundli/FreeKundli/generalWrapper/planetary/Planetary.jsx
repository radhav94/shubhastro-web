import React from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetPlanetReportQuery } from "../../../../../../redux/api/kundli/planetApi";
import PrimaryLoader from "../../../../../../component/UI/PrimaryLoader";
import PlanetaryCard from "./PlanetaryCard";

const Planetary = () => {
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
      planet: "Sun",
      lang: "en",
    }
  : skipToken;


  const { data, isLoading } = useGetPlanetReportQuery(queryArgs);
  const planetaryData = data?.response || [];

  return (
    <div>
      {isLoading && <PrimaryLoader isLoading={isLoading} />}

      {planetaryData.map((planet, i) => (
        <PlanetaryCard key={i} planet={planet} />
      ))}
    </div>
  );
};

export default Planetary;
