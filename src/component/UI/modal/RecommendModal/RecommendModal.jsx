import { useGetRecommendedAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";
// COMMENTED OUT: Replaced with NewAstrologerCard
// import RecommendedCard from "./RecommendedCard";
import NewAstrologerDetailsCard from "../../cards/newAstrologerCard/NewAstrologerDetailsCard";
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
import { useWaitingQueue } from "../../../../context/WaitingQueueContext";
import { useAstrologerConnect } from "../../../../utils/hooks/useAstrologerConnect";
import ConnectAstrologerPopup from "../../../../screens/private/v2/components/ui/ConnectAstrologerPopup";
import ProfileModals from "../../../../screens/private/kundli/components/ProfileModals";
import { useProfileManager } from "../../../../screens/private/kundli/hooks/useProfileManager";
import { useDispatch } from "react-redux";
import ProfileManager from "../../Profile/ProfileManager";

const RecommendModal = ({ open, onClose, mode = "chat", setOpen, onConnect }) => {
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

  const { cancelAllExcept, removePendingConnection, removePendingByAstrologer, cancelAll, assignRoomId } = useWaitingQueue();

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

  // Handle connect button click - now received as prop from TalkToAstrologer
  // This ensures we reuse the same validation logic (login check, waiting list check, kundli check)
  // OLD LOGIC (commented out): This was opening ConnectAstrologerPopup
  // const handleConnectClick = (astro) => {
  //   setSelectedAstrologer(astro);
  //   setIsConnectPopupOpen(true);
  //   activeCallAstroRef.current = astro;
  //   setHasStartedFlow(true); // Mark that user has started the connect flow
  // };

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
      // Don't call voiceSocket.off() — it removes ALL listeners app-wide
    };
  }, [userIdLocal, open]);

  const resetCallState = () => {
    setCallRoomId(null);
    setChatRoomId(null);

    activeCallAstroRef.current = null;
    kundliRef.current = null;

    setActiveCall(null);
    resetChatFlow();
    resetCallFlow();
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
      assignRoomId(data?.roomId, "chat", data?.waitingTime || 2);
    };

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
      assignRoomId(data?.roomId, data?.type || "audio", data?.waitingTime || 5);
    };

    const handleCallAccepted = async ({
      roomId,
      token,
      channelName,
      type,
      remainingTime,
      isSwitch,
      ...rest
    }) => {
      // If there's an active audio call and this is a video acceptance, it's an upgrade — let CallContext handle it
      if (type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        resetCallFlow();
        return;
      }

      // If there's an active video call and this is an audio acceptance, it's a downgrade — let CallContext handle it
      if (type === "audio" && activeCall && activeCall.callType === "video") {
        console.log("🔄 Audio downgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        resetCallFlow();
        return;
      }
      
      // Regular call acceptance
      resetCallFlow();
      removePendingConnection(roomId);
      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;

      try {
        setActiveCall({
          roomId,
          channelName,
          chatRoomId,
          agoraToken: token,
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astro._id,
          kundliId,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
          experience: astro?.experience,
          isEmergency: rest?.isEmergency || false,
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
      removePendingConnection(roomId);
      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;

      try {
        if (!roomId) throw new Error();

        setActiveChat({
          roomId,
          chatRoomId,
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          userId: userIdLocal,
          astrologerId: astrologerId,
          kundliId,
          astrologerName: data?.astrologer?.firstName || "",
          remainingTime: data?.remainingTime,
          isEmergency: data?.isEmergency || false,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-to-astrologer/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: data?.astrologer?.firstName || "",
            astroID: data?.astrologer?.astrologer_ID,
            experience: data?.astrologer?.experience,
            profileImgUrl: astro?.profileImgUrl || data?.astrologer?.profileImgUrl,
          },
        });
      } catch (e) {
        Toast.error("Failed to start chat");
      }
    };

    /* REJECTED */
    const handleCallRejected = (data) => {
      // Check if this is a switch rejection during an active call
      if (data?.switchRejected && (data?.type === "audio" || data?.type === "video")) {
        console.log("🔄 Call switch rejected - current call continues");
        return;
      }
      
      // Extract roomId and astrologerId — can be at top level or inside sessionData
      const rejectedRoomId = data?.roomId || data?.sessionData?.roomId;
      const rejectedAstrologerId = data?.astrologerId || data?.sessionData?.astrologerId;
      if (rejectedRoomId) {
        removePendingConnection(rejectedRoomId);
      } else if (rejectedAstrologerId) {
        removePendingByAstrologer(rejectedAstrologerId);
      }

      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected" &&
          data?.type === "chat"
          ? "Astrologer has rejected the chat request"
          : "Astrologer has rejected the call request";
      Toast.error(errorMsg);
      resetChatFlow();
      resetCallFlow();
    };

    /* ERROR */
    const handleSocketError = (err) => {
      if (err?.message === "Call has already ended") {
        resetCallState();
        return;
      }

      Toast.error(err?.message || "Connection error");
      resetCallState();
      cancelAll();
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
                  // REPLACED: RecommendedCard with NewAstrologerCard for consistency
                  // OLD LOGIC (commented out):
                  // <RecommendedCard
                  //   isActiveType={activeType}
                  //   key={astro._id}
                  //   astro={astro}
                  //   mode={mode}
                  //   onChat={() => handleConnectClick(astro)}
                  //   onAudioCall={() => handleConnectClick(astro)}
                  //   onVideoCall={() => handleConnectClick(astro)}
                  // />
                  <NewAstrologerDetailsCard
                    key={astro._id}
                    astrologer={astro}
                    onConnect={onConnect}
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
