import { useSelector } from "react-redux";
import { AppImages } from "../../../utils/appImages";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetSadesatiQuery } from "../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
const Sadesati = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = {
    dob: formData
      ? `${formData.day}/${formData.month}/${formData.year}`
      : "12/12/1999",
    tob: formData
      ? `${String(formData.hour).padStart(2, "0")}:${String(
          formData.min
        ).padStart(2, "0")}`
      : "12:12",
    lat: formData?.lat || 18.23,
    lon: formData?.lon || 71.34,
    tz: formData?.tzone || 5.5,
    lang: "en",
  };
  // : skipToken;

  const { data, isLoading } = useGetSadesatiQuery(queryArgs);
  const sadesati = data?.response;
  return (
    <>
      <PrimaryLoader isLoading={isLoading} />
      <div className="text-start">
        <div className="bg-slate-50 rounded-lg shadow-black/30 shadow-lg my-5 p-3 text-start">
          <p className="text-xl font-bold">Current Period</p>
          <div className="text-red-600 my-2 px-2 rounded-lg  ">
            <p>{sadesati?.bot_response}</p>
            <p className="text-gray-600">As on {sadesati?.date_considered}</p>
          </div>
        </div>
        <div>
          {sadesati?.remedies?.length > 0 && (
            <div className="bg-slate-50 rounded-lg shadow-black/30 shadow-lg my-5 p-3 text-start">
              <h1 className="text-xl font-bold">Recommended Remedies</h1>
              {sadesati?.remedies?.map((item, i) => (
                <div key={i} className="bg-yellow-200 my-2 p-2 rounded-lg  ">
                  <p>{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-slate-50 rounded-lg shadow-black/30 shadow-lg my-5 p-3 text-start">
          <p className="text-xl font-bold">What is Sade Sati</p>
          <div className="bg-yellow-200 my-2 p-2 rounded-lg  ">
            <p>{sadesati?.description}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sadesati;
