import { useState, useCallback } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs = TABS.map((t) => t.key);
  const tabFromUrl = searchParams.get("tab");
  const initialTab = validTabs.includes(tabFromUrl) ? tabFromUrl : "houses";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", key);
      // Clear planet sub-tab when switching away from planets
      if (key !== "planets") next.delete("planet");
      return next;
    }, { replace: true, state: location.state });
  }, [setSearchParams, location.state]);

  const planetFromUrl = parseInt(searchParams.get("planet"), 10);
  const initialPlanet = Number.isFinite(planetFromUrl) ? planetFromUrl : 0;

  const handlePlanetChange = useCallback((idx) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("planet", String(idx));
      return next;
    }, { replace: true, state: location.state });
  }, [setSearchParams, location.state]);

  // Use teva data from navigation state (from generate-teva response)
  const tevaData = location.state?.tevaData;

  // Always call planet details and debts APIs — generate-teva response often has empty data
  const { data: planetData, isLoading: planetLoading } = useGetLalKitabPlanetDetailsQuery(lalKitabId);
  const { data: debtsData, isLoading: debtsLoading } = useGetLalKitabDebtsQuery(lalKitabId);
  const { data: chartData, isLoading: chartLoading } = useGetLalKitabChartQuery(lalKitabId);

  // Merge: prefer API data (more complete), fall back to teva data
  const houses = chartData?.data?.houses || tevaData?.houses || [];
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
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === "houses" && (
          <HousesGrid houses={houses} isLoading={chartLoading && !houses.length} />
        )}
        {activeTab === "planets" && (
          <PlanetDetailsAccordion planets={planetDetails} isLoading={planetLoading} initialSelected={initialPlanet} onPlanetChange={handlePlanetChange} />
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
