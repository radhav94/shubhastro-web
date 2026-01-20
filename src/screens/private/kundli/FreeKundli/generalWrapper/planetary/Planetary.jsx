import React from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetPlanetReportQuery } from "../../../../../../redux/api/kundli/planetApi";
import PrimaryLoader from "../../../../../../component/UI/PrimaryLoader";
import PlanetaryCard from "./PlanetaryCard";

// List of all planets to fetch
const PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Saturn",
  "Jupiter",
  "Rahu",
  "Ketu",
];

const Planetary = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  // Common args
  const baseArgs = formData
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

  // Fetch each planet report
  const planetQueries = PLANETS.map((planet) =>
    useGetPlanetReportQuery(
      baseArgs === skipToken ? skipToken : { ...baseArgs, planet }
    )
  );

  // Loader check
  const isLoading = planetQueries.some((q) => q.isLoading);

  // Extract first object from each array response
  const planetaryData = planetQueries
    .map((q) => q.data?.response?.[0]) // FIX: your API returns [object]
    .filter(Boolean);

  return (
    <div>
      {isLoading && <PrimaryLoader isLoading={isLoading} />}

      {planetaryData.map((planet, index) => (
        <PlanetaryCard key={index} planet={planet} />
      ))}
    </div>
  );
};

export default Planetary;
