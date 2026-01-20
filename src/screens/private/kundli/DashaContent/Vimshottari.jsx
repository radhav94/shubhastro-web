import { useSelector } from "react-redux";
import { useGetMahaDashaPredictionsQuery } from "../../../../redux/api/kundli/dashaApi";
import styles from "./DashaContent.module.scss";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const Vimshottari = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData
    ? {
        dob: `${formData.day}/${formData.month}/${formData.year}`,
        tob: `${String(formData.hour).padStart(2, "0")}:${String(
          formData.min,
        ).padStart(2, "0")}`,
        lat: formData.lat,
        lon: formData.lon,
        tz: formData.tzone,
        lang: "en",
      }
    : skipToken;

  const { data, isLoading } = useGetMahaDashaPredictionsQuery(queryArgs);

  if (isLoading) {
    return <PrimaryLoader isLoading={isLoading} />;
  }

  if (!data?.response?.dashas) {
    return (
      <div className={styles.emptyState}>
        <p>No Dasha data available</p>
      </div>
    );
  }

  return (
    <div className={styles.dashaContainer}>
      {data.response.dashas.map((dasha, i) => (
        <div key={i} className={styles.dashaCard}>
          <div className={styles.dateRange}>
            {dasha.dasha_start_year} - {dasha.dasha_end_year}
          </div>
          <div className={styles.dashaName}>{dasha.dasha}</div>
          <div className="text-left text-gray-400 ">
            <span className={styles.desc}>Prediction : </span>{" "}
            {dasha.prediction}
          </div>
          <div className="text-left text-gray-400 ">
            <span className={styles.desc}>Planet in Zodiac : </span>{" "}
            {dasha.planet_in_zodiac}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Vimshottari;
