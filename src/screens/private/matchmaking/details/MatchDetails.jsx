import { useLocation } from "react-router-dom";
import { useGetMatchMakingQuery } from "../../../../redux/api/kundli/dashaApi";
import { FaMale, FaFemale } from "react-icons/fa";
import styles from "./MatchDetails.module.scss";
import RenderCard from "../../../../component/UI/table/matching/RenderCard";
import { PrimaryText } from "../../../../component";
import { AppImages } from "../../../../utils/appImages";
import KundliSummary from "../../../../component/UI/circular/KundliSummary";
import DynamicTable from "../../../../component/UI/table/matching/DynamicTable";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const MatchDetails = () => {
  const location = useLocation();
  const formData = location.state;
  if (!formData) return;

  const { boyData, girlData } = formData;

  // Call your matchmaking API (pass full payload)
  const { data, isLoading } = useGetMatchMakingQuery({ formData });

  const matchingDetails = data?.response;

  const boyCard = {
    Name: boyData.name,
    ["Birth Date"]: boyData.dob,
    ["Birth Time"]: boyData.tob,
    ["Birth Place"]: boyData.place,
    ["Janam Rashi"]: matchingDetails?.bhakoot?.boy_rasi_name,
  };
  const girlCard = {
    Name: girlData.name,
    ["Birth Date"]: girlData.dob,
    ["Birth Time"]: girlData.tob,
    ["Birth Place"]: girlData.place,
    ["Janam Rashi"]: matchingDetails?.bhakoot?.girl_rasi_name,
  };

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

  const headers = [
    { key: "name", label: "Attribute" },
    { key: "boy_varna", label: "Male" },
    { key: "girl_varna", label: "Female" },
    { key: "varna", label: "Received" },
    { key: "full_score", label: "Out of" },
    { key: "description", label: "Description" },
  ];

  return (
    <div className={styles.matchContainer}>
      <PrimaryText size_32 isCenter>
        Kundli Matching Report
      </PrimaryText>
      {/* Names Section */}
      <div className={styles.namesRow}>
        <p className={styles.nameBtn}>{boyData?.name}</p>
        <img
          src={AppImages.Ring}
          alt="rings-heart"
          className={styles.iconImage}
        />
        <p className={styles.nameBtn}>{girlData?.name}</p>
      </div>

      {/* Cards */}
      <div className={styles.cardsRow}>
        {RenderCard(<FaMale />, "Basic Details", "Male", "#1E90FF", boyCard)}
        {RenderCard(
          <FaFemale />,
          "Basic Details",
          "Female",
          "#E91E63",
          girlCard
        )}
      </div>
      <KundliSummary score={matchingDetails?.score} total={36} />

      <div className="w-[88.5%] mt-7">
        <DynamicTable
          title="Ashtakoot Compatibility"
          headers={headers}
          data={response}
        />
      </div>
      <p className={styles.response}>{matchingDetails?.bot_response}</p>

      {/* API loading or output (optional future addition) */}
      <PrimaryLoader isLoading={isLoading} />
    </div>
  );
};

export default MatchDetails;
