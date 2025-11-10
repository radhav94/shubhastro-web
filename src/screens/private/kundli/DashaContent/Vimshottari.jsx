import { useGetMahaDashaPredictionsQuery } from "../../../../redux/api/kundli/dashaApi";
import styles from "./DashaContent.module.scss";
const Vimshottari = () => {
  const { data, isLoading } = useGetMahaDashaPredictionsQuery({
    dob: "17/03/1977",
    tob: "11:40",
    lat: 11,
    lon: 77,
    tz: 5.5,
    lang: "en",
  });
  return (
    <div>
      {data?.response?.dashas?.map((dasha) => (
        <div className="border-gray-300 border rounded-md p-5 my-2">
          <div className="flex justify-between font-bold mb-2">
            <h2>{dasha.dasha}</h2>
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
        </div>
      ))}
    </div>
  );
};

export default Vimshottari;
