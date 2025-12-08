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
          formData.min
        ).padStart(2, "0")}`,
        lat: formData.lat,
        lon: formData.lon,
        tz: formData.tzone,
        lang: "en",
      }
    : skipToken;

  const { data, isLoading } = useGetMahaDashaPredictionsQuery(queryArgs);

  return (
    <div>
      {isLoading && <PrimaryLoader isLoading={isLoading} />}
      {data?.response?.dashas?.map((dasha, i) => (
        <div key={i} className="border-gray-300 border rounded-md p-5 my-2">
          <div className="flex justify-between font-bold mb-2">
            <h2>{dasha.dasha} Mahadasha</h2>
            <p className="text-gray-600 text-sm ">
              ({dasha.dasha_start_year} - {dasha.dasha_end_year})
            </p>
          </div>
          <p className="text-left text-gray-600">
            <span className="text-red-500 text-lg mr-5 font-bold ">
              Prediction
            </span>
            {dasha.prediction}
          </p>
          <br />
          <p className="text-left text-gray-600">
            <span className="text-red-500 text-lg mr-5 font-bold ">
              Planet in Zodiac
            </span>
            {dasha.planet_in_zodiac}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Vimshottari;
