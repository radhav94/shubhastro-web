import { AppImages } from "../../../../../utils/appImages";
import { useSelector } from "react-redux";
import { useGetPitraDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import { skipToken } from "@reduxjs/toolkit/query";

const Pitra = () => {
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

  const { data, isLoading } = useGetPitraDoshQuery(queryArgs);
  const pitra = data?.response;

  return (
    <div className="w-full">
      <PrimaryLoader isLoading={isLoading} />

      {/* Header Image */}
      <div className="relative w-full h-[260px] sm:h-[320px]">
        <img
          className="w-full h-full object-cover rounded-lg"
          src={AppImages.Dosh}
          alt="dosh"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 rounded-lg"></div>

        {/* Title + Basic Info */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white px-4">
          <h1 className="text-3xl font-bold tracking-wide">Pitra Dosh</h1>

          <div className="w-full max-w-[500px] mt-6 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-md text-center">
              <p className="text-gray-300 text-sm">Dosh Present</p>
              <p className="text-lg font-semibold">
                {pitra?.is_dosha_present ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 mt-4">
        <h2 className="text-xl font-semibold mb-2">Details</h2>
        <p className="text-gray-700 leading-relaxed text-[15px]">
          {pitra?.bot_response}
        </p>
      </div>

      {/* Effects */}
      {pitra?.effects?.length > 0 && (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">Effects of Pitra Dosh</h2>

          <ul className="bg-gray-50 p-4 rounded-lg border list-disc pl-6 space-y-2 text-gray-700">
            {pitra.effects.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Remedies */}
      {pitra?.remedies?.length > 0 && (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">Remedies</h2>

          <ul className="bg-gray-50 p-4 rounded-lg border list-disc pl-6 space-y-2 text-gray-700">
            {pitra.remedies.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add some spacing */}
      <div className="h-6"></div>
    </div>
  );
};

export default Pitra;
