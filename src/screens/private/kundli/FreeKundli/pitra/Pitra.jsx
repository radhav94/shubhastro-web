import { AppImages } from "../../../../../utils/appImages";
import { useSelector } from "react-redux";
import { useGetPitraDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";

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
            Pitra Dosh
          </h1>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Dosh Present</p>
              <p className="text-xl font-medium">
                {pitra?.is_dosha_present ? "Yes" : "No"}
              </p>
            </div>
            {/* <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
                <p className="font-medium text-gray-400 ">Dasha From Lagna</p>
                <p className="text-xl font-medium">
                  {mangal?.is_dosha_present_mars_from_lagna ? "Yes" : "No"}
                </p>
              </div> */}
          </div>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">details</p>
              <p className="text-xl font-medium">
                {pitra?.bot_response?.length > 500
                  ? pitra?.bot_response?.slice(0, 500) + "..."
                  : pitra?.bot_response}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pitra;
