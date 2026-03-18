import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import useRequireAuth from "../../../utils/hooks/useRequireAuth";

const Home = () => {
  const requireAuth = useRequireAuth();
  
  // COMMENTED OUT: No longer using ConnectAstrologerPopup
  // const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  
  // NEW: Store the connection type when opening ProfileManager
  const [pendingConnectionType, setPendingConnectionType] = useState(null);

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
    hasKundli,
    kundliRef
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
  } = useAstrologerConnection(activeCallAstroRef, kundliRef.current);

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
    // The astrologer is already stored in selectedAstrologer state and activeCallAstroRef
    // The connectionType is stored in pendingConnectionType
    // Now we need to perform the same validations as the normal flow
    
    if (selectedAstrologer && pendingConnectionType) {
      // Call the appropriate handler based on connection type
      // This ensures all validations (balance check, online check) are performed
      if (pendingConnectionType === "chat") {
        handleChatStart(selectedAstrologer);
      } else if (pendingConnectionType === "audio" || pendingConnectionType === "call") {
        handleCallStart(selectedAstrologer, "audio");
      }
      
      // Clear the pending connection type
      setPendingConnectionType(null);
    }
    
    // OLD LOGIC (commented out): This was bypassing validations
    // if (selectedAstrologer && pendingConnectionType) {
    //   hookHandleAfterKundliSelect(selectedAstrologer, pendingConnectionType);
    //   setPendingConnectionType(null);
    // }
  };

  // Handle connect button click - now receives connectionType (chat or audio)
  const handleConnectClick = (astrologer, connectionType) => {
    // Check if user is logged in
     if (!requireAuth()) return;
    
    if (WaitingList || callWaitingList) {
      Toast.error(
        "You are already waiting for an astrologer. Please cancel the current request first.",
      );
      return;
    }

    setSelectedAstrologer(astrologer);
    setAstrologerRef(astrologer);

    // NEW FLOW: Check if kundli is available and directly initiate connection
    if (hasKundli) {
      // If kundli is available, directly initiate the connection based on type
      if (connectionType === "chat") {
        console.log("Astrologer Chat:",astrologer)
        handleChatStart(astrologer);
      } else if (connectionType === "audio" || connectionType === "call") {
        console.log("Astrologer Call:",astrologer)
        handleCallStart(astrologer, "audio");
      }
    } else {
      // If no kundli, store the connection type and open ProfileManager to add kundli
      setPendingConnectionType(connectionType);
      hookSetOpenModal((prev) => ({ ...prev, kundli: true }));
    }

    // OLD FLOW (commented out for reference):
    // if (hasKundli) {
    //   // If kundli is available, show the ConnectAstrologerPopup to select Call/Chat/Video
    //   setIsConnectPopupOpen(true);
    // } else {
    //   // If no kundli, open ProfileManager to add kundli
    //   hookSetOpenModal((prev) => ({ ...prev, kundli: true }));
    // }
  };

  // COMMENTED OUT: No longer using ConnectAstrologerPopup
  // const handleClosePopup = () => {
  //   setIsConnectPopupOpen(false);
  //   setSelectedAstrologer(null);
  // };

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
              }, "mobile-");
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
                }, "desktop-left-");
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
              }, "desktop-right-");
            })}
          </div>
        </div>
      </main>

      <BottomNavigation />

      {/* Connect Astrologer Popup - COMMENTED OUT: Now skipping popup and directly initiating connections */}
      {/* {isConnectPopupOpen && selectedAstrologer && (
        <ConnectAstrologerPopup
          isOpen={isConnectPopupOpen}
          astrologer={selectedAstrologer}
          onClose={handleClosePopup}
          onChatStart={handleChatStart}
          onCallStart={handleCallStart}
        />
      )} */}

      <ProfileManager
        isOpen={hookOpenModal.kundli}
        onClose={() => hookSetOpenModal((prev) => ({ ...prev, kundli: false }))}
        startCallMode={true}
        onStartCall={handleProfileManagerStartCall}
        title="Select Profile"
        startCallModeBtnType={pendingConnectionType}
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
