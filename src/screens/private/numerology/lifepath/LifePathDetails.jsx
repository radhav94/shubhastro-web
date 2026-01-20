import React from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
// import { useGetNumerologyReportQuery } from "../../../../redux/api/numerology/numerologyApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./LifePathDetails.module.scss";
import { useGetNumerologyReportQuery } from "../../../../redux/api/numerology/numerology";
import LifePathSingleDetails from "./LifePathSingleDetails";

const LifePathDetails = () => {
const storedPayload = localStorage.getItem("numerologyPayload");
const formData = useSelector((state) => state.form.numerologyPayload)
  || (storedPayload && JSON.parse(storedPayload));

React.useEffect(() => {
  if (formData) {
    localStorage.setItem("numerologyPayload", JSON.stringify(formData));
  }
}, [formData]);

const queryArgs = formData
  ? {
      name: formData.name,
      date: formData.date,
      lang: "en",
    }
  : skipToken;


  const { data, isLoading } = useGetNumerologyReportQuery(queryArgs);

  const numerologyData = data?.response || [];

  return (
    <div className={styles.wrapper}>
      {isLoading && <PrimaryLoader isLoading={isLoading} />}
      <LifePathSingleDetails data={numerologyData}/>
    </div>
  );
};


export default LifePathDetails;
