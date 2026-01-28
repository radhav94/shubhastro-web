import { useState, useMemo } from "react";
import { Toast } from "../../../component";
import { useGetHomeDetailsQuery } from "../../../services/appServices/homeServices";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useProfileManager } from "../../private/kundli/hooks/useProfileManager";
import { useAstrologerConnection } from "./hooks/useAstrologerConnection";
import ConnectAstrologerPopup from "../../private/v2/components/ui/ConnectAstrologerPopup";
import ProfileModals from "../../private/kundli/components/ProfileModals";
import WaitingModal from "../../../component/UI/modal/waitingModal/WaitingModal";
import BottomNavigation from "./components/BottomNavigation";
import { renderSection, sortSectionsByOrder } from "./utils/sectionMapper";
import styles from "./Home.module.scss";

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
        {/* Dynamic rendering based on API response */}
        {sortedSections && sortedSections.length > 0 ? (
          sortedSections.map((section) => {
            // Skip sections without display_type
            if (!section.display_type) {
              console.warn("Section missing display_type:", section);
              return null;
            }

            // Render section based on display_type
            return renderSection(section.display_type, section, {
              onConnect: handleConnectClick,
            });
          })
        ) : (
          <div className={styles.emptyState}>
            <p>No content available</p>
          </div>
        )}
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

      {/* Profile Modals */}
      <ProfileModals
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
