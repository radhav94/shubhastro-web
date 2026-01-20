import { useSelector } from "react-redux";
import { AppImages } from "../../../../../utils/appImages";
import { useGetMangalDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
const Mangal = () => {
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

  const { data, isLoading } = useGetMangalDoshQuery(queryArgs);
  const mangal = data?.response;
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
            Mangal Dosh
          </h1>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Mangal Present</p>
              <p className="text-xl font-medium">
                {mangal?.is_dosha_present ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Dasha From Lagna</p>
              <p className="text-xl font-medium">
                {mangal?.is_dosha_present_mars_from_lagna ? "Yes" : "No"}
              </p>
            </div>
          </div>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Dosha From Moon</p>
              <p className="text-xl font-medium">
                {mangal?.is_dosha_present_mars_from_moon ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Score</p>
              <p className="text-xl font-medium">{mangal?.score}%</p>
            </div>
          </div>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">details</p>
              <p className="text-xl font-medium">
                {mangal?.bot_response?.length > 50
                  ? mangal?.bot_response?.slice(0, 50) + "..."
                  : mangal?.bot_response}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        {mangal?.factors && (
          <div className="bg-slate-50 rounded-lg shadow-lg my-5 p-3">
            <h1 className="text-xl font-bold">Mangal Analysis factors</h1>
            <div className="bg-yellow-200 my-2 p-2 rounded-lg ">
              <p>{mangal?.factors?.mars}</p>
            </div>
            <div className="bg-yellow-200 my-2 p-2 rounded-lg ">
              <p>{mangal?.factors?.moon}</p>
            </div>
          </div>
        )}
        {mangal?.cancellation?.cancellationReason.length > 0 && (
          <div className="bg-slate-50 rounded-lg shadow-black/30 shadow-lg my-5 p-3">
            <h1 className="text-xl font-bold">Cancellation / Exception</h1>
            {data?.cancellation?.cancellationReason?.map((item) => (
              <div className="bg-yellow-300 my-2 p-2 rounded-lg ">
                <p>{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Mangal;
