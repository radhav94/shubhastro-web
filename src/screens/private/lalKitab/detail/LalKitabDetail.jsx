import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styles from "./LalKitabDetail.module.scss";
import {
  useGetLalKitabChartQuery,
  useGetLalKitabPlanetDetailsQuery,
  useGetLalKitabDebtsQuery,
} from "../../../../redux/api/lalKitab/lalKitabApi";
import ChartSection from "../components/ChartSection";
import HousesGrid from "../components/HousesGrid";
import PlanetDetailsAccordion from "../components/PlanetDetailsAccordion";
import DebtsSection from "../components/DebtsSection";
import SummaryHeader from "../components/SummaryHeader";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const TABS = [
  { key: "houses", label: "Houses" },
  { key: "planets", label: "Planets & Remedies" },
  { key: "debts", label: "Debts" },
  { key: "chart", label: "Chart" },
];

const LalKitabDetail = () => {
  const { lalKitabId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("houses");

  // Use teva data from navigation state (from generate-teva response)
  const tevaData = location.state?.tevaData;

  // Always call planet details and debts APIs — generate-teva response often has empty data
  const { data: planetData, isLoading: planetLoading } = useGetLalKitabPlanetDetailsQuery(lalKitabId);
  const { data: debtsData, isLoading: debtsLoading } = useGetLalKitabDebtsQuery(lalKitabId);
  const { data: chartData, isLoading: chartLoading } = useGetLalKitabChartQuery(lalKitabId);

  // Merge: prefer API data (more complete), fall back to teva data
  const houses = tevaData?.houses || chartData?.data?.houses || [];
  const planetDetails = planetData?.data?.planetDetails || tevaData?.planetDetails || [];
  const debts = debtsData?.data?.debts || tevaData?.debts || null;
  const chart = chartData?.data || (tevaData?.svgChart ? { chartUrl: tevaData.svgChart } : null);

  const summary = tevaData?.birthDetails || tevaData || chartData?.data?.summary || {};

  const isAnyLoading = planetLoading || debtsLoading || chartLoading;

  return (
    <div className={styles.container}>
      {isAnyLoading && <PrimaryLoader />}

      <div className={styles.headerRow}>
        <button className={styles.backButton} onClick={() => navigate("/lal-kitab")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={styles.pageTitle}>Lal Kitab Teva</h1>
      </div>

      <SummaryHeader summary={summary} />

      <div className={styles.tabWrapper}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === "houses" && (
          <HousesGrid houses={houses} isLoading={chartLoading && planetLoading && !tevaData?.houses?.length} />
        )}
        {activeTab === "planets" && (
          <PlanetDetailsAccordion planets={planetDetails} isLoading={planetLoading} />
        )}
        {activeTab === "debts" && (
          <DebtsSection debts={debts} isLoading={debtsLoading} />
        )}
        {activeTab === "chart" && (
          <ChartSection chart={chart} isLoading={chartLoading && !chart} />
        )}
      </div>
    </div>
  );
};

export default LalKitabDetail;
