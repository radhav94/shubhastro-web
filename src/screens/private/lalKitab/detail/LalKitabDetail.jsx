import { useState, useCallback, useEffect } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./LalKitabDetail.module.scss";
import {
  useGetLalKitabChartQuery,
  useGetLalKitabPlanetDetailsQuery,
  useGetLalKitabDebtsQuery,
  useLazyGetLalKitabPdfQuery,
} from "../../../../redux/api/lalKitab/lalKitabApi";
import { useGetChargesQuery } from "../../../../redux/api/aiwow/aiwowApi";
import { useGetSubscriptionStatusQuery } from "../../../../redux/api/subscription/subscriptionApi";
import { useWalletBalance } from "../../wallet/useWalletBalance";
import { FiDownload } from "react-icons/fi";
import DownloadReportModal from "../../aiwow/components/DownloadReportModal";
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
  // Debts: try dedicated API, then chart data, then navigation state
  const rawDebts = debtsData?.data;
  const apiDebts = rawDebts?.debts?.selfDebts ? rawDebts.debts : (rawDebts?.selfDebts ? rawDebts : null);
  const chartDebts = chartData?.data?.debts?.selfDebts ? chartData.data.debts : null;
  const tevaDebts = tevaData?.debts?.selfDebts ? tevaData.debts : null;
  const debts = apiDebts || chartDebts || tevaDebts || null;
  console.log("[LalKitab Debts Debug]", { rawDebts, chartDataDebts: chartData?.data?.debts, tevaDataDebts: tevaData?.debts, resolvedDebts: debts });
  const chart = chartData?.data || (tevaData?.svgChart ? { chartUrl: tevaData.svgChart } : null);

  const summary = tevaData?.birthDetails || tevaData || chartData?.data?.summary || {};

  const isAnyLoading = planetLoading || debtsLoading || chartLoading;
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isFreeReport, setIsFreeReport] = useState(false);
  const [triggerGetPdf] = useLazyGetLalKitabPdfQuery();
  const { balance: walletBalance, refreshWallet } = useWalletBalance();

  const customerToken = typeof window !== "undefined" ? localStorage.getItem("shubhtalk_customer_token") : null;
  const { data: subscriptionStatus } = useGetSubscriptionStatusQuery(undefined, { skip: !customerToken });
  const hasActiveSubscription = !!subscriptionStatus?.data?.hasActiveSubscription;

  // Charges only matter for non-subscribed users; subscribed users download
  // directly with no popup, so skip the charges API for them.
  const { data: chargesData } = useGetChargesQuery(undefined, { skip: hasActiveSubscription });

  // Download price from charges API (non-subscribed users only).
  const getDownloadCost = () => {
    if (isFreeReport || hasActiveSubscription) return 0;
    const charges = chargesData?.data;
    if (!charges) return null;
    const slug = "lal-kitab-report";
    for (const section of charges) {
      if (!Array.isArray(section?.list)) continue;
      const match = section.list.find((c) => c?.slug?.toLowerCase() === slug);
      if (match) return match.amount ?? 0;
    }
    return null;
  };

  const downloadPrice = getDownloadCost();

  // Check if report was already downloaded (from API data or navigation state)
  useEffect(() => {
    const pdfUrl =
      chartData?.data?.pdfPath ||
      chartData?.data?.["lal-kitabPdfPath"] ||
      tevaData?.pdfPath ||
      tevaData?.["lal-kitabPdfPath"];
    if (pdfUrl) {
      setIsFreeReport(true);
    }
  }, [chartData, tevaData]);

  const handleDownloadClick = () => {
    // Subscribed users download directly — no charge popup.
    if (hasActiveSubscription) {
      handleConfirmDownload();
      return;
    }
    refreshWallet();
    setShowDownloadModal(true);
  };

  const handleConfirmDownload = async () => {
    setIsDownloading(true);
    try {
      toast.loading("Downloading PDF...", { id: "lalkitab-pdf" });
      const result = await triggerGetPdf({ historyId: lalKitabId }).unwrap();
      const pdfUrl = result?.data?.pdfUrl;
      if (!pdfUrl) throw new Error("PDF URL not found");
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "lal-kitab-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success("PDF downloaded!", { id: "lalkitab-pdf" });
      setShowDownloadModal(false);
      setIsFreeReport(true);
      refreshWallet();
    } catch {
      toast.error("Failed to download PDF", { id: "lalkitab-pdf" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={styles.container}>
      {isAnyLoading && <PrimaryLoader />}

      <div className={styles.headerRow}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={styles.pageTitle}>Laal Kitab Teva</h1>
        <button className={styles.downloadBtn} onClick={handleDownloadClick} disabled={isDownloading}>
          <div className={styles.downloadContent}>
            <FiDownload size={22} />
            <div className={styles.downloadText}>
              <span className={styles.downloadTitle}>{isDownloading ? "Downloading..." : "Download Now"}</span>
            </div>
          </div>
        </button>
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
          <DebtsSection debts={debts} isLoading={debtsLoading && !debtsError && !debts} />
        )}
        {activeTab === "chart" && (
          <ChartSection chart={chart} isLoading={chartLoading && !chart} />
        )}
      </div>

      {/* Consult with Astrologer */}
      <div className={styles.consultCta}>
        <button className={styles.consultBtn} onClick={() => navigate("/astrologers")}>
          Consult with Expert Astrologer
        </button>
      </div>

      <DownloadReportModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleConfirmDownload}
        featureName="Laal Kitab Report"
        downloadCost={downloadPrice ?? 0}
        walletBalance={walletBalance ?? 0}
        isDownloading={isDownloading}
        showLanguageSelection={false}
        generatedLanguages={isFreeReport ? { en: true } : undefined}
      />
    </div>
  );
};

export default LalKitabDetail;
