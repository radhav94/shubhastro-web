import { useState } from "react";
import { Toast } from "../../../component";
import { useGetHomeDetailsQuery } from "../../../services/appServices/homeServices";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useProfileManager } from "../../private/kundli/hooks/useProfileManager";
import { useAstrologerConnection } from "./hooks/useAstrologerConnection";
import ConnectAstrologerPopup from "../../private/v2/components/ui/ConnectAstrologerPopup";
import ProfileModals from "../../private/kundli/components/ProfileModals";
import WaitingModal from "../../../component/UI/modal/waitingModal/WaitingModal";
import HoroscopeCard from "./components/HoroscopeCard";
import ConsultationCarousel from "./components/ConsultationCarousel";
import QuickActions from "./components/QuickActions";
import PanditAISection from "./components/PanditAISection";
import AstrologersSection from "./components/AstrologersSection";
import LifeAreaSection from "./components/LifeAreaSection";
import MySessionsSection from "./components/MySessionsSection";
import CosmicInsightSection from "./components/CosmicInsightSection";
import PanchangSection from "./components/PanchangSection";
import DiscoverMoreSection from "./components/DiscoverMoreSection";
import BlogsSection from "./components/BlogsSection";
import BottomNavigation from "./components/BottomNavigation";
import styles from "./Home.module.scss";

const Home = () => {
    const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
    const [selectedAstrologer, setSelectedAstrologer] = useState(null);

    // Fetch home data
    const { data, isLoading } = useGetHomeDetailsQuery();
    const homeList = data?.data?.list;

    // Extract data from API
    const astrologerSectionOnline = homeList?.find(
        (item) => item.slug === "astrologer"
    );
    const astrologersOnline = astrologerSectionOnline?.content || [];

    const OurastrologerSection = homeList?.find(
        (item) => item.slug === "our-astrologers"
    );
    const Ourastrologers = OurastrologerSection?.content || [];

    const blogSection = homeList?.find((item) => item.display_type === "blog");
    const blogData = blogSection?.content || [];

    // Use profile manager hook
    const {
        selectedProfile,
        profiles,
        profilesLoading,
        isCreating,
        showSelectProfile,
        showAddProfile,
        showEditProfile,
        formData,
        editFormData,
        setShowSelectProfile,
        setShowAddProfile,
        setShowEditProfile,
        setFormData,
        setEditFormData,
        handleAddProfile,
        handleEditProfile,
        handleSubmitProfile,
        handleSubmitEditProfile,
        formatProfileDisplay,
    } = useProfileManager();

    // Use astrologer connection hook
    const {
        WaitingList,
        callWaitingList,
        connectionType,
        localSelectedProfile,
        setLocalSelectedProfile,
        resetCallState,
        setSelectedAstrologer: setAstrologerRef,
    } = useAstrologerConnection();

    // Use the astrologer connect hook
    const {
        handleChatStart,
        handleCallStart,
        handleAfterKundliSelect: hookHandleAfterKundliSelect,
        openModal: hookOpenModal,
        setOpenModal: hookSetOpenModal,
    } = useAstrologerConnect();

    // Handler for profile selection
    const handleProfileSelect = (profile) => {
        setLocalSelectedProfile(profile);
    };

    // Handler for Continue button
    const handleContinueAfterKundliSelect = () => {
        if (localSelectedProfile) {
            hookHandleAfterKundliSelect(localSelectedProfile);
        }
    };

    // Handle connect button click
    const handleConnectClick = (astrologer) => {
        if (WaitingList || callWaitingList) {
            Toast.error(
                "You are already waiting for an astrologer. Please cancel the current request first."
            );
            return;
        }

        setSelectedAstrologer(astrologer);
        setAstrologerRef(astrologer);
        setIsConnectPopupOpen(true);
    };

    const handleClosePopup = () => {
        setIsConnectPopupOpen(false);
        setSelectedAstrologer(null);
    };

    if (isLoading) {
        return (
            <div className={styles.home}>
                <div className={styles.mainContent}>Loading...</div>
            </div>
        );
    }

    return (
        <div className={styles.home}>
            <main className={styles.mainContent}>
                <HoroscopeCard />
                <ConsultationCarousel />
                <QuickActions />
                <PanditAISection />

                <AstrologersSection
                    title="TOP RATED ASTROLOGERS FOR YOU"
                    astrologers={astrologersOnline}
                    onConnect={handleConnectClick}
                />

                <LifeAreaSection />
                <MySessionsSection />
                <CosmicInsightSection />
                <PanchangSection />

                <AstrologersSection
                    title="ASTROLOGERS FOR YOU"
                    astrologers={Ourastrologers}
                    onConnect={handleConnectClick}
                />

                <DiscoverMoreSection />
                <BlogsSection blogData={blogData} />
            </main>

            <BottomNavigation />

            {/* Connect Astrologer Popup */}
            {isConnectPopupOpen && selectedAstrologer && (
                <ConnectAstrologerPopup
                    astrologer={selectedAstrologer}
                    onClose={handleClosePopup}
                />
            )}

            {/* Profile Modals */}
            <ProfileModals
                showSelectProfile={showSelectProfile}
                showAddProfile={showAddProfile}
                showEditProfile={showEditProfile}
                profiles={profiles}
                profilesLoading={profilesLoading}
                isCreating={isCreating}
                formData={formData}
                editFormData={editFormData}
                selectedProfile={localSelectedProfile}
                setShowSelectProfile={setShowSelectProfile}
                setShowAddProfile={setShowAddProfile}
                setShowEditProfile={setShowEditProfile}
                setFormData={setFormData}
                setEditFormData={setEditFormData}
                handleAddProfile={handleAddProfile}
                handleEditProfile={handleEditProfile}
                handleSubmitProfile={handleSubmitProfile}
                handleSubmitEditProfile={handleSubmitEditProfile}
                formatProfileDisplay={formatProfileDisplay}
                handleProfileSelect={handleProfileSelect}
                handleContinue={handleContinueAfterKundliSelect}
            />

            {/* Waiting Modal */}
            {(WaitingList || callWaitingList) && (
                <WaitingModal
                    isOpen={WaitingList || callWaitingList}
                    onClose={resetCallState}
                    waitingTime={WaitingList || callWaitingList}
                    type={connectionType}
                />
            )}
        </div>
    );
};

export default Home;
