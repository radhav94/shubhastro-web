import { useState, useMemo } from "react";
import { Toast, RechargeModal } from "../../../component";
import { useGetHomeDetailsQuery } from "../../../services/appServices/homeServices";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useProfileManager } from "../../private/kundli/hooks/useProfileManager";
import { useAstrologerConnection } from "./hooks/useAstrologerConnection";
import ConnectAstrologerPopup from "../../private/v2/components/ui/ConnectAstrologerPopup";
import ProfileModals from "../../private/kundli/components/ProfileModals";
import BottomNavigation from "./components/BottomNavigation";
import { renderSection, sortSectionsByOrder } from "./utils/sectionMapper";
import styles from "./Home.module.scss";
import {ProfileManager} from "../../../component/UI/Profile";

const Home = () => {
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);

  // Fetch home data
  const { data, isLoading } = useGetHomeDetailsQuery();
  const homeList = data?.data?.list;

  // Sort sections by list_order for proper rendering sequence
  const sortedSections = useMemo(() => {
    return sortSectionsByOrder(homeList);
  }, [homeList]);

  // Use profile manager hook
  const {
    profiles,
    isCreating,
    showAddProfile,
    showEditProfile,
    formData,
    editFormData,
    setShowAddProfile,
    setShowEditProfile,
    setFormData,
    setEditFormData,
    handleAddProfile,
    handleSubmitProfile,
    handleSubmitEditProfile,
    formatProfileDisplay,
  } = useProfileManager();

  // Use the astrologer connect hook
  const {
    handleChatStart,
    handleCallStart,
    handleAfterKundliSelect: hookHandleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
    selectedAstrologer: hookSelectedAstrologer,
    activeCallAstroRef,
  } = useAstrologerConnect();

  // Use astrologer connection hook (pass the ref from useAstrologerConnect)
  const {
    WaitingList,
    callWaitingList,
    connectionType,
    localSelectedProfile,
    setLocalSelectedProfile,
    resetCallState,
    setSelectedAstrologer: setAstrologerRef,
  } = useAstrologerConnection(activeCallAstroRef);

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

  // Handler for ProfileManager startCallMode - receives selected profile and triggers connection
  const handleProfileManagerStartCall = (selectedProfile) => {
    hookHandleAfterKundliSelect(selectedProfile);
  };

  // Handle connect button click
  const handleConnectClick = (astrologer) => {
    if (WaitingList || callWaitingList) {
      Toast.error(
        "You are already waiting for an astrologer. Please cancel the current request first.",
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

  // Handler for AI chat start with initial query
  const handleAIChatStart = async (astrologer, initialQuery) => {
    console.log("🤖 AI Chat Start - Astrologer:", astrologer, "Query:", initialQuery);
    
    // Store the initial query in localStorage to send after chat room is created
    if (initialQuery) {
      localStorage.setItem("aiInitialQuery", initialQuery);
    }
    
    // Use the regular chat start flow - skip balance check for Pandit AI
    await handleChatStart(astrologer, false);
  };


  // Separate sections into left and right columns for desktop
  const leftSectionTypes = ['complementary-services', 'daily-cosmic-insight', 'explore-panchang'];
  
  const leftSections = useMemo(() => {
    const filtered = sortedSections?.filter(section => 
      leftSectionTypes.includes(section.display_type)
    ) || [];
    
    // Sort by the order defined in leftSectionTypes
    return filtered.sort((a, b) => {
      const indexA = leftSectionTypes.indexOf(a.display_type);
      const indexB = leftSectionTypes.indexOf(b.display_type);
      return indexA - indexB;
    });
  }, [sortedSections]);
  
  const rightSections = sortedSections?.filter(section => 
    !leftSectionTypes.includes(section.display_type)
  ) || [];

  return (
    <div className={styles.home}>
      <main className={styles.mainContent}>
        {/* Mobile View - Original Layout */}
        <div className={styles.mobileLayout}>
          {sortedSections && sortedSections.length > 0 && (
            sortedSections.map((section) => {
              if (!section.display_type) {
                console.warn("Section missing display_type:", section);
                return null;
              }
              return renderSection(section.display_type, section, {
                onConnect: handleConnectClick,
                onChatStart: handleAIChatStart,
              });
            })
          )}
        </div>

        {/* Desktop View - Two Column Layout */}
        <div className={styles.twoColumnLayout}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* <div className={styles.leftColumnMain}> */}
              {leftSections.map((section) => {
                if (!section.display_type) {
                  console.warn("Section missing display_type:", section);
                  return null;
                }
                return renderSection(section.display_type, section, {
                  onConnect: handleConnectClick,
                  onChatStart: handleAIChatStart,
                });
              })}
            </div>
          {/* </div> */}

          {/* Right Column */}
          <div className={styles.rightColumn}>
            {rightSections.map((section) => {
              if (!section.display_type) {
                console.warn("Section missing display_type:", section);
                return null;
              }
              return renderSection(section.display_type, section, {
                onConnect: handleConnectClick,
                onChatStart: handleAIChatStart,
              });
            })}
          </div>
        </div>
      </main>

      <BottomNavigation />

      {/* Connect Astrologer Popup */}
      {isConnectPopupOpen && selectedAstrologer && (
        <ConnectAstrologerPopup
          isOpen={isConnectPopupOpen}
          astrologer={selectedAstrologer}
          onClose={handleClosePopup}
          onChatStart={handleChatStart}
          onCallStart={handleCallStart}
        />
      )}

      <ProfileManager
        isOpen={hookOpenModal.kundli}
        onClose={() => hookSetOpenModal((prev) => ({ ...prev, kundli: false }))}
        startCallMode={true}
        onStartCall={handleProfileManagerStartCall}
        title="Select Profile to Continue"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Profile Modals */}
      {/* <ProfileModals
        showSelectProfile={hookOpenModal.kundli}
        showAddProfile={showAddProfile}
        showEditProfile={showEditProfile}
        profiles={profiles}
        selectedProfile={localSelectedProfile}
        formData={formData}
        editFormData={editFormData}
        isCreating={isCreating}
        onCloseSelect={() => {
          hookSetOpenModal((prev) => ({ ...prev, kundli: false }));
          setLocalSelectedProfile(null);
        }}
        onCloseAdd={() => setShowAddProfile(false)}
        onCloseEdit={() => setShowEditProfile(false)}
        onSelectProfile={handleProfileSelect}
        onAddProfile={handleAddProfile}
        onSubmitProfile={handleSubmitProfile}
        onSubmitEditProfile={handleSubmitEditProfile}
        setFormData={setFormData}
        setEditFormData={setEditFormData}
        formatProfileDisplay={formatProfileDisplay}
        showContinueButton={true}
        onContinue={handleContinueAfterKundliSelect}
      /> */}

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={hookOpenModal.recharge}
        onClose={() =>
          hookSetOpenModal((prev) => ({ ...prev, recharge: false }))
        }
        astrologer={selectedAstrologer || hookSelectedAstrologer}
        connectionType={connectionType}
      />
    </div>
  );
};

export default Home;
