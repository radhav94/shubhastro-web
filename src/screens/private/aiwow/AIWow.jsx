import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./AIWow.module.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SeoHelmet from "../../../component/SeoHelmet";
import toast from "react-hot-toast";
import FeatureCard from "./components/FeatureCard";
import MobileAppModal from "./components/MobileAppModal";
import ResultHistoryCard from "./components/ResultHistoryCard";
import DownloadReportModal from "./components/DownloadReportModal";
import { ProfileManager, GuestKundliAuthModal } from "../../../component/UI/Profile";
import { useGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { useGetAiWowPageDataQuery, useGetAiHistoryQuery, useGetChargesQuery, useDownloadReportPdfMutation } from "../../../redux/api/aiwow/aiwowApi";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { setSelectedKundliProfile } from "../../../redux/aiwow/aiwowSlice";
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { PATH } from "../../../utils/routes/Paths";
import { trackEvent } from "../../../utils/analytics";

// Reusable Section Title with Divider (same as Explore page, auto-width)
const SectionTitleWithDivider = ({ title, description, styles }) => (
  <div className={styles.sectionHeader}>
    <div className={styles.titleWithDivider}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.dividerContainer}>
        <div className={styles.dividerLine} />
        <span style={{ flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
            <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
          </svg>
        </span>
        <div className={styles.dividerLine} />
      </div>
    </div>
    {description && <p className={styles.sectionDescription}>{description}</p>}
  </div>
);

const AIWow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const pendingGuestActionRef = useRef(null);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [activeTab, setActiveTab] = useState("aiwow");
  const [downloadModal, setDownloadModal] = useState({ open: false, featureId: null, featureName: "" });
  const [isDownloading, setIsDownloading] = useState(false);
  const [paidToFreeIds, setPaidToFreeIds] = useState({});
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  const { balance: walletBalance, refreshWallet } = useWalletBalance();
  const [downloadReportPdf] = useDownloadReportPdfMutation();

  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);
  const headerSelectedKundli = useSelector((state) => state.kundli.selectedKundli);

  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  const { data, isLoading, isFetching } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });

  const { data: aiwowData } = useGetAiWowPageDataQuery();

  // Charges data — fetched once, cached for 5 min by RTK Query
  const { data: chargesData } = useGetChargesQuery();

  const kundliId = selectedProfile?._id || selectedProfile?.id || "";
  const { data: historyData, isLoading: isHistoryLoading, isFetching: isHistoryFetching, refetch: refetchHistory } = useGetAiHistoryQuery(
    { kundliId, page: historyPage, limit: 10 },
    { skip: !kundliId }
  );

  const profiles = data?.data || [];
  const aiwowSections = aiwowData?.data?.list || [];
  const rawHistoryList = historyData?.data?.history || [];
  const charges = chargesData?.data || null;

  // Deduplicate history — same featureId OR same featureType within 2 min = same analysis
  const historyList = useMemo(() => {
    // Pass 1: deduplicate by featureId
    const byFeatureId = new Map();
    for (const item of rawHistoryList) {
      // // Exclude Daily Horoscope from result history
      // if (item.featureName?.toLowerCase() === "daily horoscope") continue;
      const key = item.featureId || item._id;
      const existing = byFeatureId.get(key);
      if (!existing || (item.pdfPath && !existing.pdfPath)) {
        byFeatureId.set(key, item);
      }
    }
    // Pass 2: sort by time desc, then collapse items of same featureType within 2 min
    const sorted = Array.from(byFeatureId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const result = [];
    for (const item of sorted) {
      const time = new Date(item.createdAt).getTime();
      const duplicate = result.find(
        (r) => r.featureType === item.featureType && Math.abs(new Date(r.createdAt).getTime() - time) < 120000
      );
      if (duplicate) {
        // Keep the one with pdfPath
        if (item.pdfPath && !duplicate.pdfPath) {
          const idx = result.indexOf(duplicate);
          result[idx] = item;
        }
      } else {
        result.push(item);
      }
    }
    return result;
  }, [rawHistoryList]);

  // Check if more pages available
  useEffect(() => {
    if (historyData?.data?.pagination) {
      const { page, totalPages } = historyData.data.pagination;
      setHasMoreHistory(page < totalPages);
    }
  }, [historyData]);

  // Set active tab from navigation state (e.g., from result page Download button)
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Refetch history when results tab is active to pick up downloads done on result pages
  useEffect(() => {
    if (activeTab === "results" && kundliId) {
      refetchHistory();
    }
  }, [activeTab, location.key]);

  // Reset page when profile changes
  useEffect(() => {
    setHistoryPage(1);
    setHasMoreHistory(true);
  }, [kundliId]);

  // Ref to guard against multiple rapid scroll triggers
  const isFetchingRef = useRef(false);

  // Sync ref with RTK Query fetching state
  useEffect(() => {
    isFetchingRef.current = isHistoryFetching;
  }, [isHistoryFetching]);

  // Infinite scroll handler — uses window scroll
  useEffect(() => {
    if (activeTab !== "results") return;
    const handleScroll = () => {
      if (isFetchingRef.current || !hasMoreHistory) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        isFetchingRef.current = true;
        setHistoryPage((prev) => prev + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab, hasMoreHistory]);

  // Find download cost from charges data by matching featureName to slug in charges
  const getDownloadCost = (featureName) => {
    if (!charges || !featureName) return 0;
    const slug = featureName.trim().replace(/\s+/g, "-") + "-report";
    // charges is array of sections, each has a .list array with { slug, amount }
    for (const section of charges) {
      if (!Array.isArray(section?.list)) continue;
      const match = section.list.find((c) => c?.slug?.toLowerCase() === slug.toLowerCase());
      if (match) return match.amount ?? 0;
    }
    return 0;
  };

  useEffect(() => {
    if (isFetching) return;
    if (profiles.length === 0) {
      dispatch(setSelectedKundliProfile(null));
      localStorage.removeItem("selectedKundliProfile");
      return;
    }

    // If header has a selected kundli, sync AIWow to it (use fresh data from profiles)
    if (headerSelectedKundli?._id) {
      const freshProfile = profiles.find((p) => p._id === headerSelectedKundli._id);
      if (freshProfile) {
        dispatch(setSelectedKundliProfile(freshProfile));
        localStorage.setItem("selectedKundliProfile", JSON.stringify(freshProfile));
        return;
      }
    }

    const saved = localStorage.getItem("selectedKundliProfile");
    let parsed = null;
    try {
      parsed = saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem("selectedKundliProfile");
    }
    if (parsed) {
      const freshProfile = profiles.find((p) => p._id === parsed._id);
      if (freshProfile) {
        dispatch(setSelectedKundliProfile(freshProfile));
        localStorage.setItem("selectedKundliProfile", JSON.stringify(freshProfile));
        return;
      }
    }
    const first = profiles[0];
    dispatch(setSelectedKundliProfile(first));
    localStorage.setItem("selectedKundliProfile", JSON.stringify(first));
  }, [profiles, isFetching, dispatch, headerSelectedKundli]);

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
    dispatch(setSelectedKundli(profile));
    localStorage.setItem("selectedKundliProfile", JSON.stringify(profile));
    setShowProfileModal(false);
  };

  // A guest has no auth token yet.
  const isGuest = !token;

  // Open the guest kundli+OTP flow, remembering the action to run afterwards.
  const startGuestAuth = (action) => {
    pendingGuestActionRef.current = typeof action === "function" ? action : null;
    setShowGuestAuthModal(true);
  };

  // After the guest logs in and their kundli is created, run the pending action.
  const handleGuestAuthSuccess = (profile) => {
    setShowGuestAuthModal(false);
    if (profile?._id) {
      dispatch(setSelectedKundliProfile(profile));
      dispatch(setSelectedKundli(profile));
      localStorage.setItem("selectedKundliProfile", JSON.stringify(profile));
    }
    const action = pendingGuestActionRef.current;
    pendingGuestActionRef.current = null;
    if (action) action(profile);
  };

  const navigateToFeature = (slug) => {
    if (slug === "ar-vastu-scanner") {
      setShowMobileAppModal(true);
    } else {
      // All AI WOW features live under the /ai-wow/ prefix
      trackEvent("shubh_ai_feature_opened", { feature_name: slug });
      navigate(`/ai-wow/${slug}`);
    }
  };

  const handleClick = (slug) => {
    // AR Vastu Scanner is an app-only feature — show its own modal directly,
    // never the guest kundli popup or an auth gate.
    if (slug === "ar-vastu-scanner") {
      setShowMobileAppModal(true);
      return;
    }
    // Allow guest users to view intro pages for these features
    const guestAccessSlugs = ["ai-palmistry-scanner", "astro-face-reading", "signature-analysis", "clothes-colour-analysis", "gemstone-authenticity", "aura-photography", "dream-interpreter"];
    // All features require login
    const freeAccessSlugs = [];
    if (!freeAccessSlugs.includes(slug) && !guestAccessSlugs.includes(slug)) {
      // Guests: collect kundli details + verify OTP instead of redirecting to login.
      if (isGuest) {
        startGuestAuth(() => navigateToFeature(slug));
        return;
      }
      if (!selectedProfile) {
        // A toast alone left the tile looking unresponsive. Open the Kundli
        // picker as well so the tap leads somewhere the user can act on.
        toast.error("Please select one Kundli to proceed.");
        setShowProfileModal(true);
        return;
      }
    }
    navigateToFeature(slug);
  };

  const handleProfileClick = () => {
    if (isGuest) {
      startGuestAuth(() => setShowProfileModal(true));
      return null;
    }
    setShowProfileModal(true);
  };

  const fetchPdfUrl = async (featureId, language) => {
    const result = await downloadReportPdf({ historyId: featureId, language }).unwrap();
    const pdfUrl = result?.data?.pdfUrl;
    if (!pdfUrl) throw new Error("PDF URL not found in response");
    return pdfUrl;
  };

  const handleDownloadPdf = async (item) => {
    // Check if PDF already exists: key is `{featureType}PdfPath` or just `pdfPath`
    const pdfKey = `${item.featureType}PdfPath`;
    const existingPdfUrl = item.pdfPath || item[pdfKey];
    
    if (existingPdfUrl || paidToFreeIds[item._id]) {
      // Free — directly download existing PDF
      try {
        toast.loading("Downloading PDF...", { id: "pdf-download" });
        const url = existingPdfUrl || await fetchPdfUrl(item.featureId);
          const res = await fetch(url);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `${item.featureName || "ai-report"}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(blobUrl);
        toast.success("PDF downloaded!", { id: "pdf-download" });
      } catch {
        toast.error("Failed to download PDF", { id: "pdf-download" });
      }
    } else {
      // Paid — open the download modal
      refreshWallet();
      setDownloadModal({ open: true, featureId: item.featureId, id: item._id, featureName: item.featureName });
    }
  };

  const handleConfirmDownload = async (language) => {
    const { featureId, id, featureName } = downloadModal;
    setIsDownloading(true);
    try {
      toast.loading("Downloading PDF...", { id: "pdf-download" });
      const pdfUrl = await fetchPdfUrl(featureId, language);
        const res = await fetch(pdfUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${featureName || "ai-report"}-${language}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Delay toast to let iOS handle the download trigger without swallowing it
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          toast.dismiss("pdf-download");
          toast.success("Payment Successful! PDF downloaded.", { id: "pdf-download-success", duration: 3000 });
        }, 600);
      // Mark ONLY this history entry as free locally so its ribbon updates.
      // (Keyed by the unique entry id, not featureId — otherwise other selected
      // categories that share the same feature would all wrongly show "Free".)
      setPaidToFreeIds(prev => ({ ...prev, [id]: true }));
      setDownloadModal({ open: false, featureId: null, id: null, featureName: "" });
      refreshWallet();
      // Reset to page 1 and refetch to get updated pdfPath (shows "Free" on reload)
      setHistoryPage(1);
      refetchHistory();
    } catch {
      toast.error("Failed to download PDF", { id: "pdf-download" });
    } finally {
      setIsDownloading(false);
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

  const handleResultHistory = () =>{
    if (isGuest) {
      startGuestAuth(() => {
        setActiveTab("results");
        trackEvent("shubh_ai_past_reports_viewed", {});
      });
      return null;
    }
    setActiveTab("results")
    trackEvent("shubh_ai_past_reports_viewed", {});
  }

  return (
    <>
      <SeoHelmet data={aiwowData?.data} />
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
              Shubh AI
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "results" ? styles.tabActive : ""}`}
              onClick={handleResultHistory}
            >
              Result History
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {/* Shubh AI Tab */}
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
                    <SectionTitleWithDivider
                      title={section?.title}
                      description={section?.description}
                      styles={styles}
                    />
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
              {isHistoryLoading && historyPage === 1 ? (
                <PrimaryLoader />
              ) : historyList.length === 0 ? (
                <div className={styles.resultsPlaceholder}>No history found</div>
              ) : (
                <>
                  {historyList.map((item) => (
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
                        isPaid: !item.pdfPath && !item[`${item.featureType}PdfPath`] && !paidToFreeIds[item._id],
                        price: null,
                        charges,
                        onViewResult: () => handleViewResultPdf(item.featureId),
                        onDownload: () => handleDownloadPdf(item),
                      }}
                    />
                  ))}
                  {isHistoryFetching && historyPage > 1 && (
                    <div className={styles.loadingMore}>Loading more...</div>
                  )}

                </>
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

        <GuestKundliAuthModal
          isOpen={showGuestAuthModal}
          onClose={() => {
            setShowGuestAuthModal(false);
            pendingGuestActionRef.current = null;
          }}
          onSuccess={handleGuestAuthSuccess}
        />

        <MobileAppModal
          isOpen={showMobileAppModal}
          onClose={() => setShowMobileAppModal(false)}
        />

        <DownloadReportModal
          isOpen={downloadModal.open}
          onClose={() => setDownloadModal({ open: false, featureId: null, featureName: "" })}
          onDownload={handleConfirmDownload}
          featureName={downloadModal.featureName}
          downloadCost={getDownloadCost(downloadModal.featureName)}
          walletBalance={walletBalance ?? 0}
          isDownloading={isDownloading}
          showLanguageSelection={false}
        />
      </div>
    </>
  );
};

export default AIWow;
