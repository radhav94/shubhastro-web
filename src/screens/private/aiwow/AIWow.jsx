import { useState, useEffect } from "react";
import styles from "./AIWow.module.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import axios from "axios";
import FeatureCard from "./components/FeatureCard";
import MobileAppModal from "./components/MobileAppModal";
import ResultHistoryCard from "./components/ResultHistoryCard";
import { ProfileManager } from "../../../component/UI/Profile";
import { useGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { useGetAiWowPageDataQuery, useGetAiHistoryQuery } from "../../../redux/api/aiwow/aiwowApi";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { setSelectedKundliProfile } from "../../../redux/aiwow/aiwowSlice";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import Footer from "../../../layouts/Footer";
import { PATH } from "../../../utils/routes/Paths";

const AIWow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const requireAuth = useRequireAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [activeTab, setActiveTab] = useState("aiwow");

  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);

  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  const { data, isLoading, isFetching } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });

  const { data: aiwowData } = useGetAiWowPageDataQuery();

  const kundliId = selectedProfile?._id || selectedProfile?.id || "";
  const { data: historyData, isLoading: isHistoryLoading } = useGetAiHistoryQuery(kundliId, {
    skip: !kundliId,
  });

  const profiles = data?.data || [];
  const aiwowSections = aiwowData?.data?.list || [];
  const historyList = historyData?.data?.history || [];
  // console.log("=== AIWOW DEBUG ===", { activeTab, kundliId, historyData, historyList, isHistoryLoading });

  useEffect(() => {
    if (isFetching) return;
    if (profiles.length === 0) {
      dispatch(setSelectedKundliProfile(null));
      localStorage.removeItem("selectedKundliProfile");
      return;
    }
    const saved = localStorage.getItem("selectedKundliProfile");
    let parsed = null;
    try {
      parsed = saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem("selectedKundliProfile");
    }
    if (parsed && profiles.some((p) => p._id === parsed._id)) {
      dispatch(setSelectedKundliProfile(parsed));
      return;
    }
    const first = profiles[0];
    dispatch(setSelectedKundliProfile(first));
    localStorage.setItem("selectedKundliProfile", JSON.stringify(first));
  }, [profiles, isFetching, dispatch]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    }
  }, [location]);

  const handleProfileSelect = (profile) => {
    dispatch(setSelectedKundliProfile(profile));
    localStorage.setItem("selectedKundliProfile", JSON.stringify(profile));
    setShowProfileModal(false);
  };

  const handleClick = (slug) => {
    if (!requireAuth()) return;
    if (!selectedProfile) {
      toast.error("Please select one Kundli to proceed.");
      return;
    }
    if (slug === "ar-vastu-scanner") {
      setShowMobileAppModal(true);
    } else {
      navigate(`/aiwow/${slug}`);
    }
  };

  const handleProfileClick = () => {
    if (!requireAuth()) return null;
    setShowProfileModal(true);
  };

  const fetchPdfUrl = async (featureId) => {
    const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
    const response = await axios.get(
      `${BASE_URL}/api/ai-history/pdf?historyId=${featureId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const pdfUrl = response.data?.data?.pdfUrl;
    if (!pdfUrl) throw new Error("PDF URL not found in response");
    return pdfUrl;
  };

  const handleDownloadPdf = async (featureId, featureName) => {
    try {
      toast.loading("Downloading PDF...", { id: "pdf-download" });
      const pdfUrl = await fetchPdfUrl(featureId);
      // Fetch blob from S3 URL to force download (cross-origin anchor download doesn't work)
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${featureName || "ai-report"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success("PDF downloaded!", { id: "pdf-download" });
    } catch {
      toast.error("Failed to download PDF", { id: "pdf-download" });
    }
  };

  const handleViewResultPdf = async (featureId) => {
    try {
      toast.loading("Opening PDF...", { id: "pdf-view" });
      const pdfUrl = await fetchPdfUrl(featureId);
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      toast.success("PDF opened!", { id: "pdf-view" });
    } catch {
      toast.error("Failed to open PDF", { id: "pdf-view" });
    }
  };

  return (
    <>
      <div className={styles.container}>
        {isLoading && <PrimaryLoader />}

        <header className={styles.headerWrap}>
          {/* Row 1: Back + Profile */}
          <div className={styles.header}>
            <span className={styles.headerBack}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => navigate(PATH.privateRoutes.HOME.path)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </span>
            <div className={styles.profileSelector} onClick={handleProfileClick}>
              <span className={styles.selectLabel}>Select Profile</span>
              <span className={styles.profileName}>
                {selectedProfile ? selectedProfile.name : "Select Profile"}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{ display: "inline-block", marginLeft: "4px", verticalAlign: "middle" }}
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>

          {/* Row 2: Tabs */}
          <div className={styles.tabsRow}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "aiwow" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("aiwow")}
            >
              AI WOW
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "results" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("results")}
            >
              Result History
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {/* AI WOW Tab */}
          {activeTab === "aiwow" && (
            <>
              <div className={styles.heroSection}>
                <div className={styles.heroBadge}>Powered by Advanced AI</div>
                <h2 className={styles.heroTitle}>AI Experiences</h2>
                <p className={styles.heroSubtitle}>
                  Explore the future of astrology with our cutting-edge AI-powered tools and
                  experiences
                </p>
              </div>

              {aiwowSections?.map((section) =>
                section?.status ? (
                  <div className={styles.section} key={section?.ID}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>{section?.title}</h2>
                      <p className={styles.sectionDescription}>{section?.description}</p>
                    </div>
                    <div className={styles.featureGrid}>
                      {section?.content?.map((feature) =>
                        feature?.publishStatus ? (
                          <FeatureCard
                            key={feature.id}
                            badge={feature.badge}
                            badgeType={feature.badgeType}
                            title={feature.title}
                            description={feature.description}
                            icon={feature.icon}
                            onStartNow={() => handleClick(feature?.slug)}
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                ) : null
              )}
            </>
          )}

          {/* Result History Tab */}
          {activeTab === "results" && (
            <div className={styles.resultsList}>
              {isHistoryLoading ? (
                <PrimaryLoader />
              ) : historyList.length === 0 ? (
                <div className={styles.resultsPlaceholder}>No history found</div>
              ) : (
                historyList.map((item) => (
                  <ResultHistoryCard
                    key={item._id}
                    item={{
                      featureName: item.featureName || "AI Analysis",
                      featureIcon: null,
                      status: (item.status || "completed").toLowerCase(),
                      date: item.createdAt
                        ? new Date(item.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "",
                      summary: item.summary || "",
                      isPaid: false,
                      price: null,
                      onViewResult: () => handleViewResultPdf(item.featureId),
                      onDownload: () => handleDownloadPdf(item.featureId, item.featureName),
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <ProfileManager
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onProfileSelect={handleProfileSelect}
          selectedProfileId={selectedProfile?._id}
          title="Select Profile"
          enabledOperations={{ list: true, add: true, edit: true, delete: true }}
        />

        <MobileAppModal
          isOpen={showMobileAppModal}
          onClose={() => setShowMobileAppModal(false)}
        />
      </div>
      <Footer />
    </>
  );
};

export default AIWow;
