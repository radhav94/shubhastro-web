import { useSelector } from "react-redux";
import { useGetSadeSatiTableQuery, useGetSadesatiQuery } from "../../../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import { skipToken } from "@reduxjs/toolkit/query";
import Table from "../../../../../component/UI/table/kundli/free-report/Table";
import styles from "./SadeSati.module.scss";
import { GiStonePath, GiMeditation } from "react-icons/gi";
import { MdOutlineTipsAndUpdates } from "react-icons/md";

const SadeSati = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData
    ? {
      dob: `${formData.day}/${String(formData.month).padStart(2, "0")}/${formData.year}`,
      tob: `${String(formData.hour).padStart(2, "0")}:${String(
        formData.min
      ).padStart(2, "0")}`,
      lat: formData.lat,
      lon: formData.lon,
      tz: formData.tzone,
      lang: "en",
    }
    : skipToken;

  const { data:sadeSatiTableResponse, isLoading } = useGetSadeSatiTableQuery(queryArgs);
  const sadeSatiTableData = sadeSatiTableResponse?.response;
  const { data:sadeSatiResponse } = useGetSadesatiQuery(queryArgs);
  const sadeSatiData = sadeSatiResponse?.response;
  const isInSadeSati = sadeSatiData?.shani_period_type;

  return (
    <div className="w-full">
      <PrimaryLoader isLoading={isLoading} />
      <div className={styles.wrapper}>
        <div className={styles.statusCard}>
          <p className={styles.statusTitle}>
            {isInSadeSati
              ? "You Are in Sade Sati Period"
              : "You Are Not in Sade Sati"}
          </p>
          <p className={styles.statusMessage}>{sadeSatiData?.bot_response}</p>
          <p className={styles.dateText}>
            As on {sadeSatiData?.date_considered}
          </p>
        </div>
        {sadeSatiData?.remedies?.length > 0 && (
          <div className={styles.card}>
            <div className={styles.headingBox}>
              <GiMeditation className={styles.headingIcon} />
              <p className={styles.heading}>Recommended Remedies</p>
            </div>

            <div className={styles.remediesGrid}>
              {sadeSatiData.remedies.map((item, i) => (
                <div key={i} className={styles.remedyItem}>
                  <MdOutlineTipsAndUpdates className={styles.remedyIcon} />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <Table sadeSatiTableData={sadeSatiTableData} />
      </div>
    </div >
  );
};

export default SadeSati;
