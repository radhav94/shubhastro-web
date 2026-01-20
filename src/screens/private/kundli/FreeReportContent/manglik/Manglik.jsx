import { useSelector } from "react-redux";
import { AppImages } from "../../../../../utils/appImages";
import { useGetManglikDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
const Manglik = () => {
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

  const { data, isLoading } = useGetManglikDoshQuery(queryArgs);
  const manglik = data?.response;
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
            Manglik Dosh
          </h1>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">By Mars</p>
              <p className="text-xl font-medium">
                {manglik?.manglik_by_mars ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">By Rahu / Ketu</p>
              <p className="text-xl font-medium">
                {manglik?.manglik_by_rahuketu ? "Yes" : "No"}
              </p>
            </div>
          </div>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">By Saturn</p>
              <p className="text-xl font-medium">
                {manglik?.manglik_by_saturn ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Score</p>
              <p className="text-xl font-medium">{manglik?.score}%</p>
            </div>
          </div>
          <div className="flex justify-start gap-6 my-2">
            <div className="flex-col mx-2 flex-1 bg-black/10 rounded-md ">
              <p className="font-medium text-gray-400 ">Summary</p>
              <p className="text-xl font-medium">
                {manglik?.bot_response?.length > 50
                  ? manglik?.bot_response?.length.slice(0, 50) + "..."
                  : manglik?.bot_response}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        {manglik?.factors?.length > 0 && (
          <div className="bg-slate-50 rounded-lg shadow-black/30 shadow-lg my-5 p-3">
            <h1 className="text-xl font-bold">Manglik Analysis factors</h1>
            {manglik?.factors?.map((item, i) => (
              <div key={i} className="bg-yellow-200 my-2 p-2 rounded-lg ">
                <p>{item}</p>
              </div>
            ))}
          </div>
        )}
        {manglik?.aspects.length > 0 && (
          <div className="bg-slate-50 rounded-lg shadow-black/30 shadow-lg my-5 p-3">
            <h1 className="text-xl font-bold">Manglik Aspects</h1>
            {manglik?.aspects?.map((item, i) => (
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

export default Manglik;
