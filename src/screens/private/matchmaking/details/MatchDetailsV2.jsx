import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useGetMatchMakingQuery } from "../../../../redux/api/kundli/dashaApi";
import { PATH } from "../../../../utils/routes/Paths";
import styles from "./MatchDetails.module.scss";
// import RenderCard from "../../../../component/UI/table/matching/RenderCard";
// import { PrimaryText } from "../../../../component";
// import { AppImages } from "../../../../utils/appImages";
import KundliSummary from "../../../../component/UI/circular/KundliSummaryV2";
import DynamicTable from "../../../../component/UI/table/matching/DynamicTableV2";
// import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
// import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
// import ServiceCards from "../../home/components/serviceCards/ServiceCards";
// import ZodiacCarousel from "../../horoscope/zodiacCarousel/ZodiacCarousel";

// const scores = [
//   { type: "Vashya", score: "2/2" },
//   { type: "Vashya", score: "1/1" },
//   { type: "Vashya", score: "3/4" },
//   { type: "Vashya", score: "0/8" },
//   { type: "Vashya", score: "2/2" },
//   { type: "Vashya", score: "9/9" },
//   { type: "Vashya", score: "1/7" },
//   { type: "Vashya", score: "10/10" },
// ];

const MatchDetailsV2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state;
  if (!formData) return;

  const handleBack = () => {
    navigate(-1);
  };

  const handleTalkToExpert = () => {
    navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path, {
      state: { selectedType: "love-relationships" }
    });
  };

  const { boyData, girlData } = formData;

  // Call your matchmaking API (pass full payload)
  const { data } = useGetMatchMakingQuery({ formData });

  const matchingDetails = data?.response;

  // const boyCard = {
  //   Name: boyData.name,
  //   ["Birth Date"]: boyData.dob,
  //   ["Birth Time"]: boyData.tob,
  //   ["Birth Place"]: boyData.place,
  //   ["Janam Rashi"]: matchingDetails?.bhakoot?.boy_rasi_name,
  // };
  // const girlCard = {
  //   Name: girlData.name,
  //   ["Birth Date"]: girlData.dob,
  //   ["Birth Time"]: girlData.tob,
  //   ["Birth Place"]: girlData.place,
  //   ["Janam Rashi"]: matchingDetails?.bhakoot?.girl_rasi_name,
  // };

  const response = {
    varna: {
      name: matchingDetails?.varna?.name,
      boy_varna: matchingDetails?.varna?.boy_varna,
      girl_varna: matchingDetails?.varna?.girl_varna,
      varna: matchingDetails?.varna?.varna,
      full_score: matchingDetails?.varna?.full_score,
      description: matchingDetails?.varna?.description,
    },
    vaishya: {
      name: matchingDetails?.vasya?.name,
      boy_varna: matchingDetails?.vasya?.boy_vasya,
      girl_varna: matchingDetails?.vasya?.girl_vasya,
      varna: matchingDetails?.vasya?.vasya,
      full_score: matchingDetails?.vasya?.full_score,
      description: matchingDetails?.vasya?.description,
    },
    tara: {
      name: matchingDetails?.tara?.name,
      boy_varna: matchingDetails?.tara?.boy_tara,
      girl_varna: matchingDetails?.tara?.girl_tara,
      varna: matchingDetails?.tara?.tara,
      full_score: matchingDetails?.tara?.full_score,
      description: matchingDetails?.tara?.description,
    },
    yoni: {
      name: matchingDetails?.yoni?.name,
      boy_varna: matchingDetails?.yoni?.boy_yoni,
      girl_varna: matchingDetails?.yoni?.girl_yoni,
      varna: matchingDetails?.yoni?.yoni,
      full_score: matchingDetails?.yoni?.full_score,
      description: matchingDetails?.yoni?.description,
    },
    grahamaitri: {
      name: matchingDetails?.grahamaitri?.name,
      boy_varna: matchingDetails?.grahamaitri?.boy_lord,
      girl_varna: matchingDetails?.grahamaitri?.girl_lord,
      varna: matchingDetails?.grahamaitri?.grahamaitri,
      full_score: matchingDetails?.grahamaitri?.full_score,
      description: matchingDetails?.grahamaitri?.description,
    },
    bhakoot: {
      name: matchingDetails?.bhakoot?.name,
      boy_varna: matchingDetails?.bhakoot?.boy_rasi_name,
      girl_varna: matchingDetails?.bhakoot?.girl_rasi_name,
      varna: matchingDetails?.bhakoot?.bhakoot,
      full_score: matchingDetails?.bhakoot?.full_score,
      description: matchingDetails?.bhakoot?.description,
    },
    gana: {
      name: matchingDetails?.gana?.name,
      boy_varna: matchingDetails?.gana?.boy_gana,
      girl_varna: matchingDetails?.gana?.girl_gana,
      varna: matchingDetails?.gana?.gana,
      full_score: matchingDetails?.gana?.full_score,
      description: matchingDetails?.gana?.description,
    },
    nadi: {
      name: matchingDetails?.nadi?.name,
      boy_varna: matchingDetails?.nadi?.boy_nadi,
      girl_varna: matchingDetails?.nadi?.girl_nadi,
      varna: matchingDetails?.nadi?.nadi,
      full_score: matchingDetails?.nadi?.full_score,
      description: matchingDetails?.nadi?.description,
    },
  };

  // const headers = [
  //   { key: "name", label: "Attribute" },
  //   { key: "boy_varna", label: "Male" },
  //   { key: "girl_varna", label: "Female" },
  //   { key: "varna", label: "Received" },
  //   { key: "full_score", label: "Out of" },
  //   { key: "description", label: "Description" },
  // ];
  return (
    <div className="bg-[#F7F7F7] min-h-screen flex flex-col items-center font-sans">
      {/* Header with Back Button and Title */}
      <div className="w-full bg-white sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 py-3 md:py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-gray-200 hover:shadow-md transition-shadow"
              aria-label="Go back"
            >
              <ChevronLeft size={24} className="text-[#FF6A3D]" />
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-gray-800">Match Making</h1>
          </div>
        </div>
      </div>

      <div className="w-full p-4">{/* Total Score Card */}
      <div className="bg-white w-full md:max-w-6xl mx-auto rounded-xl shadow-md p-6 mb-4 text-center">
        {/* Score Box */}
        <KundliSummary score={matchingDetails?.score} total={36} />
        {/* Description */}
        <div className="text-sm text-gray-700">
          The score shows strong overall compatibility for marital harmony.
        </div>
      </div>
      {/* Mutual Influence Cards */}
      <div className="w-full p-6 flex flex-col items-center">

        <div className={styles.compatibilityTitle}>
          <h1>Compatibility Breakdown</h1>
          <div className={styles.titleLine}>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="107" height="1" viewBox="0 0 107 1" fill="none">
                <path d="M106.303 0.406393C106.303 0.630933 103.949 0.812789 101.045 0.812789C98.1416 0.812789 0 0.630933 0 0.406393C0 0.181853 98.1423 0 101.045 0C103.949 0 106.303 0.181853 106.303 0.406393Z" fill="#030303"/>
              </svg>
            </span>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </span>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="107" height="1" viewBox="0 0 107 1" fill="none">
                <path d="M-4.3613e-07 0.406393C-4.3613e-07 0.630933 2.35392 0.812789 5.25766 0.812789C8.1614 0.812789 106.303 0.630933 106.303 0.406393C106.303 0.181853 8.16078 0 5.25766 0C2.35392 0 -4.3613e-07 0.181853 -4.3613e-07 0.406393Z" fill="#030303"/>
              </svg>
            </span>
          </div>
        </div>

        <div className="w-full md:max-w-8xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <DynamicTable
              data={response}
            />
        </div>

        {/* CTA Button */}
        <button className={styles.talkBtn} onClick={handleTalkToExpert}>
          Talk to a Matchmaking Expert
        </button>

      </div>
      </div>
    </div>
  );
};

export default MatchDetailsV2;
