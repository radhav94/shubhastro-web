import { useGetRecommendedAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";
import RecommendedCard from "./RecommendedCard";
import styles from "./recommendModal.module.scss";
import { IoClose } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { Toast, RechargeModal } from "../../..";
import { useCall } from "../../../../context/CallContext";
import { useWalletBalance } from "../../../../screens/private/wallet/useWalletBalance";
import { getToken } from "../../../../utils/token";
import { voiceSocket } from "../../../../services/voiceSocketServices";
import { useCreateChatRoomMutation } from "../../../../redux/api/chatApi";
import { useNavigate, useLocation } from "react-router-dom";
import PrimaryLoader from "../../PrimaryLoader";
import { useGetBalanceMutation } from "../../../../redux/api/wallet/walletApi";
import { useChat } from "../../../../context/ChatContext";
import { useAstrologerConnect } from "../../../../utils/hooks/useAstrologerConnect";
import ConnectAstrologerPopup from "../../../../screens/private/v2/components/ui/ConnectAstrologerPopup";
import ProfileModals from "../../../../screens/private/kundli/components/ProfileModals";
import { useProfileManager } from "../../../../screens/private/kundli/hooks/useProfileManager";
import { useDispatch } from "react-redux";
import ProfileManager from "../../Profile/ProfileManager";

const RecommendModal = ({ open, onClose, mode = "chat", setOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: recommendedAstros, isLoading } =
    useGetRecommendedAstrologersQuery();

  const currentPath = location.pathname.split("/").pop();

  // Use the astrologer connect hook (same as TalkToAstrologer)
  const {
    handleChatStart: hookHandleChatStart,
    handleCallStart: hookHandleCallStart,
    handleAfterKundliSelect: hookHandleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
  } = useAstrologerConnect();

  // Use profile manager hook (same as TalkToAstrologer)
  const {
    selectedProfile: profileManagerSelectedProfile,
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
  } = useProfileManager(dispatch);

  // Local state for selected profile (to avoid closing modal)
  const [localSelectedProfile, setLocalSelectedProfile] = useState(null);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [hasStartedFlow, setHasStartedFlow] = useState(false); // Track if user started connect flow

  const {
    activeCall,
    setActiveCall,
    waitingList: callWaitingList,
    setWaitingList: setCallWaitingList,
    setActiveCallRoomId,
    resetCallFlow,
    setLastCallType,
    setLastSelectedKundli,
    setLastRequestedAstro: setLastRequestedCallAstro,
  } = useCall();

  const {
    setActiveChat,
    setWaitingList,
    WaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setLastRequestedAstro,
    setChatSeconds,
  } = useChat();

  // ✅ Ref for current calling astrologer (no re-render)
  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null); // selected kundliId

  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);

  const [createChatRoom] = useCreateChatRoomMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  // Detect type based on URL
  const getTypeFromURL = () => {
    if (currentPath.includes("chat")) return "chat";
    if (currentPath.includes("talk")) return "video,audio";
    return mode === "chat" ? "chat" : "video,audio"; // fallback to mode prop
  };

  // 🔥 Set initial activeType from URL
  const [activeType, setActiveType] = useState(getTypeFromURL());

  // 🔄 Update activeType if URL changes
  useEffect(() => {
    setActiveType(getTypeFromURL());
  }, [location, mode]);

  const token = getToken();
  const { balance } = useWalletBalance();
  const [getBalance] = useGetBalanceMutation();

  // Custom handler for profile selection (doesn't close modal)
  const handleProfileSelect = (profile) => {
    setLocalSelectedProfile(profile);
  };

  // Handler for Continue button (triggers socket emit)
  const handleContinueAfterKundliSelect = () => {
    if (localSelectedProfile) {
      hookHandleAfterKundliSelect(localSelectedProfile);
    }
  };

  // Handler for ProfileManager startCallMode - receives selected profile and triggers connection
  const handleProfileManagerStartCall = (selectedProfile) => {
    hookHandleAfterKundliSelect(selectedProfile);
  };

  // Handle connect button click - open popup
  const handleConnectClick = (astro) => {
    setSelectedAstrologer(astro);
    setIsConnectPopupOpen(true);
    activeCallAstroRef.current = astro;
    setHasStartedFlow(true); // Mark that user has started the connect flow
  };

  /* ------------------- SOCKET CALL FLOW (ADDED ONLY) ------------------- */

  useEffect(() => {
    if (!userIdLocal || !open) return;

    if (!voiceSocket.connected) {
      voiceSocket.io.opts.query = {
        userId: userIdLocal,
        role: "CUSTOMER",
      };
      voiceSocket.connect();
    }

    return () => {
      voiceSocket.off();
    };
  }, [userIdLocal, open]);

  const resetCallState = () => {
    setCallRoomId(null);
    setChatRoomId(null);

    activeCallAstroRef.current = null;
    kundliRef.current = null;

    setActiveCall(null);
  };

  useEffect(() => {
    if (!userIdLocal || !open) return;

    /* Room ready event */
    const handleReturnRoom = ({ roomId }) => {
      setCallRoomId(roomId);
      setCallWaitingList(5); // Show waiting for call
    };

    const handleChatRoom = (data) => {
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingList(data?.waitingTime || 2);
    };

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
    };

    const handleCallAccepted = async ({
      roomId,
      token,
      type,
      remainingTime,
    }) => {
      resetCallFlow();
      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;

      try {
        setActiveCall({
          roomId,
          chatRoomId,
          agoraToken: token,
          callerName: astro.firstName,
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astro._id,
          kundliId,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
        });
      } catch {
        Toast.error("Failed to start call");
      }
    };

    const handleChatAccepted = async ({
      astrologerId,
      roomId,
      userId,
      ...data
    }) => {
      setWaitingList(false);
      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;

      try {
        if (!roomId) throw new Error();

        setActiveChat({
          roomId,
          chatRoomId,
          callerName: astro.firstName,
          isUserSide: true,
          userId: userIdLocal,
          astrologerId: astrologerId,
          kundliId,
          astrologerName: data?.astrologer?.firstName || "",
          remainingTime: data?.remainingTime,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-with-astrologers/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: astro.firstName,
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: data?.astrologer?.firstName || "",
            astroID: data?.astrologer?.astrologer_ID,
            experience: data?.astrologer?.experience
          },
        });
      } catch (e) {
        Toast.error("Failed to start chat");
      }
    };

    /* REJECTED */
    const handleCallRejected = (data) => {
      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected" &&
          data?.type === "chat"
          ? "Astrologer has rejected the chat request"
          : "Astrologer has rejected the call request";
      Toast.error(errorMsg);
      resetCallState();
      resetChatFlow();
      resetCallFlow();
    };

    /* ERROR */
    const handleSocketError = (err) => {
      if (err?.message === "Call has already ended") {
        // soft reset only
        resetCallState();
        return;
      }

      Toast.error(err?.message || "Connection error");
      resetCallState();
    };

    /* CALL ENDED */
    const handleCallEnded = () => {
      resetCallState();
    };

    // Attach events
    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("chat:rejected", handleCallRejected);
    voiceSocket.on("call:rejected", handleCallRejected);
    voiceSocket.on("error", handleSocketError);
    voiceSocket.on("call:ended", handleCallEnded);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("chat:rejected", handleCallRejected);
      voiceSocket.off("call:rejected", handleCallRejected);
      voiceSocket.off("error", handleSocketError);
      voiceSocket.off("call:ended", handleCallEnded);
    };
  }, [userIdLocal, open]);

  return (
    <>
      {/* Profile Modals - using ProfileModals like TalkToAstrologer */}
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

      {/* Recharge modal from hook for popup flow */}
      <RechargeModal
        isOpen={hookOpenModal.recharge}
        onClose={() =>
          hookSetOpenModal((prev) => ({ ...prev, recharge: false }))
        }
        astrologer={selectedAstrologer}
        connectionType={mode === "chat" ? "chat" : "call"}
      />

      {/* Connect Astrologer Popup */}
      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={() => setIsConnectPopupOpen(false)}
        astrologer={selectedAstrologer}
        onChatStart={hookHandleChatStart}
        onCallStart={hookHandleCallStart}
      />

      {/* Only show RecommendModal when kundli modal is NOT open AND user hasn't started flow */}
      {!hookOpenModal.kundli && !hasStartedFlow && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <PrimaryLoader isLoading={isLoading} />

            {/* HEADER */}
            <div className={styles.modalHeader}>
              <h3>Recommended Astrologers</h3>
              <button className={styles.close} onClick={onClose}>
                <IoClose size={22} />
              </button>
            </div>

            {/* BODY */}
            <div className={styles.modalBody}>
              <div className={styles.grid}>
                {recommendedAstros?.data?.map((astro) => (
                  <RecommendedCard
                    isActiveType={activeType}
                    key={astro._id}
                    astro={astro}
                    mode={mode}
                    onChat={() => handleConnectClick(astro)}
                    onAudioCall={() => handleConnectClick(astro)}
                    onVideoCall={() => handleConnectClick(astro)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecommendModal;
