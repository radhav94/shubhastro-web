import { AppImages } from "../../../../../utils/appImages";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetKaalSarpDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import { useSelector } from "react-redux";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";

const KaalSarp = () => {
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

  const { data, isLoading } = useGetKaalSarpDoshQuery(queryArgs);
  const kaalsarp = data?.response;
  return (
    <div>
      <PrimaryLoader isLoading={isLoading} />
      <div className="relative w-[100%] h-[270px]">
        <img
          className="w-[100vw] h-[270px] object-cover rounded-lg"
          src={AppImages.Dosh}
          alt="dosh"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 rounded-lg"></div>

        {/* Text */}
        <div className="absolute inset-0 flex flex-col text-white  p-4">
          <h1 className="text-2xl text-center font-bold text-white tracking-wider">
            Kaal Sarp Dosh
          </h1>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Dosh Present</p>
              <p className="text-xl font-medium">
                {kaalsarp?.is_dosha_present ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Dosha Type</p>
              <p className="text-xl font-medium">--</p>
            </div>
          </div>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Dosha Direction</p>
              <p className="text-xl font-medium">--</p>
            </div>
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Rahu Ketu Axis</p>
              <p className="text-xl font-medium">--</p>
            </div>
          </div>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Details</p>
              <p className="text-xl font-medium">
                {kaalsarp?.bot_response?.length > 50
                  ? kaalsarp?.bot_response?.length.slice(0, 50) + "..."
                  : kaalsarp?.bot_response}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        {kaalsarp?.remedies?.length > 0 && (
          <div className="bg-slate-50 rounded-lg shadow-black/30 shadow-lg my-5 p-3">
            <h1 className="text-xl font-bold">Remedies</h1>
            {kaalsarp?.remedies?.map((item, i) => (
              <div key={i} className="bg-yellow-200 my-2 p-2 rounded-lg ">
                <p>{item}</p>
              </div>
            ))}
          </div>
        )}
        {kaalsarp?.aspects?.length > 0 && (
          <div className="bg-slate-50 rounded-lg shadow-black/30 shadow-lg my-5 p-3">
            <h1 className="text-xl font-bold">Kaal Sarp Aspects</h1>
            {kaalsarp?.aspects?.map((item, i) => (
              <div key={i} className="bg-yellow-200 my-2 p-2 rounded-lg ">
                <p>{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KaalSarp;
