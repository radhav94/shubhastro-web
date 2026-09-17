// Astrologers.jsx
import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import styles from "./Astrologers.module.scss";
import { Title, Toast } from "../../../../../component";
import AstrologerCard from "../../../../../component/UI/cards/AstrologersCard";
import RechargeModal from "../../../../../component/UI/modal/RechargeModal/RechargeModal";
import { useCreateChatRoomMutation } from "../../../../../redux/api/chatApi";
import { useGetAstrologersQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import { getToken } from "../../../../../utils/token";
import { PATH } from "../../../../../utils/routes/Paths";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";
import { useGetBalanceMutation } from "../../../../../redux/api/wallet/walletApi";
import { useChat } from "../../../../../context/ChatContext";
import { useAstrologerConnect } from "../../../../../utils/hooks/useAstrologerConnect";
import { useWaitingQueue } from "../../../../../context/WaitingQueueContext";
import ConnectAstrologerPopup from "../../../v2/components/ui/ConnectAstrologerPopup";
import EmergencySessionModal from "../../../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";
import ProfileModals from "../../../kundli/components/ProfileModals";
import { useProfileManager } from "../../../kundli/hooks/useProfileManager";
import { getAstrologerDisplayName } from "../../../../../utils/helper/string.utils";

const Astrologers = ({ title, astrologers = [], onClickView, onProfile }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    setCallSeconds
  } = useCall();

  const {
    setActiveChat,
    setWaitingList,
    WaitingList,
    resetChatFlow,
    activeChatRoomId,
    setActiveChatRoomId,
    setLastRequestedAstro,
    lastRequestedAstro,
    setChatSeconds
  } = useChat();

  const { cancelAllExcept, removePendingConnection, removePendingByAstrologer, assignRoomId } = useWaitingQueue();

  const page = 1;
  const limit = 3;

  // 🔹 Skip API if astrologers prop already exists
  const shouldSkipApi = astrologers.length > 0;

  const { data: apiResponse } = useGetAstrologersQuery(
    { page, limit },
    { skip: shouldSkipApi }
  );

  // 🔹 Use prop first, fallback to API
  const astrologerList =
    astrologers.length > 0
      ? astrologers
      : apiResponse?.data?.result || [];

  // Use the astrologer connect hook (same as TalkToAstrologer)
  const {
    handleChatStart: hookHandleChatStart,
    handleCallStart: hookHandleCallStart,
    handleAfterKundliSelect: hookHandleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
    // The connection the user actually tapped (chat / audio / video). The hook
    // sets this to "chat" on the chat path and to the call type on the call
    // path (see setRechargeType in useAstrologerConnect), so the recharge popup
    // can show the right rate and wording.
    rechargeType: hookRechargeType,
    rechargeRequiredAmount: hookRechargeRequiredAmount,
    rechargePricePerMinute: hookRechargePricePerMinute,
    kundliRef
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
    placeReopenSignal,
    formatProfileDisplay,
  } = useProfileManager(dispatch);

  // Local state for selected profile (to avoid closing modal)
  const [localSelectedProfile, setLocalSelectedProfile] = useState(null);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // 🔹 ADDED: arrow disable states
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const [createChatRoom] = useCreateChatRoomMutation();
  const [getBalance] = useGetBalanceMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const scrollRef = useRef(null);

  const token = getToken();

  //  keep astro in ref (important)
  const activeCallAstroRef = useRef(null);
  // const kundliRef = useRef(null);
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);

  // ---------------- SCROLL LOGIC (ADDED ONLY) ----------------

  const checkScrollPosition = () => {
    const el = scrollRef.current;
    if (!el) return;

    setIsAtStart(el.scrollLeft === 0);
    setIsAtEnd(
      Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth
    );
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener("scroll", checkScrollPosition);

    return () => el.removeEventListener("scroll", checkScrollPosition);
  }, []);

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

  // Handle connect button click - open popup
  const handleConnectClick = (astro) => {
    setSelectedAstrologer(astro);
    setIsConnectPopupOpen(true);
    activeCallAstroRef.current = astro;
  };

  // ---------------- SOCKET LISTENERS ----------------

  useEffect(() => {
    if (!userIdLocal) return;

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

    const handleCallAccepted = async ({ roomId, token, channelName, type, remainingTime, isSwitch, ...rest }) => {
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
      const astro = rest?.astrologer || activeCallAstroRef.current || {};
      const kundliId = kundliRef.current;

      try {
        setActiveCall({
          roomId,
          channelName,
          chatRoomId,
          agoraToken: token,
          callerName: getAstrologerDisplayName(astro),
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astro._id,
          kundliId,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
          experience: astro?.experience,
          isEmergency: rest?.isEmergency || false,
          profileImgUrl: astro?.profileImgUrl || rest?.astrologer?.profileImgUrl,
        });
        setCallSeconds(Number(remainingTime) * 60);
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
      const astro = data?.astrologer || activeCallAstroRef.current || {};
      const kundliId = kundliRef.current;

      try {
        if (!roomId) throw new Error();

        setActiveChat({
          roomId,
          chatRoomId,
          callerName: getAstrologerDisplayName(astro),
          isUserSide: true,
          userId: userIdLocal,
          astrologerId: astrologerId,
          astrologerID: astro?.astrologer_ID || data?.astrologer?.astrologer_ID,
          kundliId,
          astrologerName: getAstrologerDisplayName(data?.astrologer),
          remainingTime: data?.remainingTime,
          isEmergency: data?.isEmergency || false,
          profileImgUrl: astro?.profileImgUrl || data?.astrologer?.profileImgUrl,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-to-astrologer/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: getAstrologerDisplayName(astro),
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: getAstrologerDisplayName(data?.astrologer),
            astroID: data?.astrologer?.astrologer_ID,
            experience: data?.astrologer?.experience,
            profileImgUrl: astro?.profileImgUrl || data?.astrologer?.profileImgUrl,
          },
        });
      } catch (e) {
        Toast.error("Failed to start chat");
      }
    };

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
      resetCallFlow();
      resetChatFlow();
    };

    const handleSocketError = (err) => {
      if (err?.message === "Call has already ended") {
        return;
      }
      Toast.error(err?.message || "Connection error");
    };

    const handleCallEnded = () => {
      activeCallAstroRef.current = null;
    };

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
  }, [userIdLocal, setActiveCall]);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  // ---------------- UI ----------------

  return (
    <div className={styles.astrologersWrapper}>
      <Title
        title={title}
        showDivider
        showButton
        buttonTitle="View All"
        onButtonClick={onClickView}
      />

      {astrologerList?.length > 3 && (
        <button
          className={styles.leftArrow}
          onClick={scrollLeft}
          disabled={isAtStart}
          style={{
            opacity: isAtStart ? 0.4 : 1,
            cursor: isAtStart ? "not-allowed" : "pointer",
          }}
        >
          &lt;
        </button>
      )}

      <div
        className={`${styles.cardsContainer} ${astrologerList?.length > 3 ? styles.scrollMode : ""}`}
        ref={scrollRef}
      >
        {astrologerList?.map((astrologer) => (
          <div key={astrologer._id} className={styles.cardWrapper}>
            <AstrologerCard
              data={astrologer}
              onChat={() => handleConnectClick(astrologer)}
              onProfile={() => onProfile(astrologer)}
              onAudioCall={() => handleConnectClick(astrologer)}
              onVideoCall={() => handleConnectClick(astrologer)}
              disabled={!!activeCall}
              isLayoutClassic={false}
              isActiveType={astrologer?.isActiveType}
            />
          </div>
        ))}
      </div>

      {astrologerList?.length > 3 && (
        <button
          className={styles.rightArrow}
          onClick={scrollRight}
          disabled={isAtEnd}
          style={{
            opacity: isAtEnd ? 0.4 : 1,
            cursor: isAtEnd ? "not-allowed" : "pointer",
          }}
        >
          &gt;
        </button>
      )}

      {/* Profile Modals - using ProfileModals like TalkToAstrologer */}
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
        placeReopenSignal={placeReopenSignal}
        showContinueButton={true}
        onContinue={handleContinueAfterKundliSelect}
      />

      {/* Recharge modal from hook for popup flow */}
      <RechargeModal
        isOpen={hookOpenModal.recharge}
        onClose={() =>
          hookSetOpenModal((prev) => ({ ...prev, recharge: false }))
        }
        astrologer={selectedAstrologer}
        // Was hardcoded "chat", so tapping Call still showed the chat rate and
        // "start chat" wording (e.g. ₹40 = 5 x chat rate for an audio call
        // priced differently). Use what the user actually tapped; falls back to
        // "chat" for the same default the modal already uses.
        connectionType={hookRechargeType || "chat"}
        requiredAmount={hookRechargeRequiredAmount}
        pricePerMinute={hookRechargePricePerMinute}
      />

      {/* Connect Astrologer Popup */}
      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={() => setIsConnectPopupOpen(false)}
        astrologer={selectedAstrologer}
        onChatStart={hookHandleChatStart}
        onCallStart={hookHandleCallStart}
        onEmergencyAvailable={() => {
          setIsConnectPopupOpen(false);
          setShowEmergencyModal(true);
        }}
      />

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={selectedAstrologer}
        onChatNow={(astro) => {
          setShowEmergencyModal(false);
          hookHandleChatStart(astro, true, true);
        }}
        onCallNow={(astro) => {
          setShowEmergencyModal(false);
          hookHandleCallStart(astro, "audio", true);
        }}
        onVideoNow={(astro) => {
          setShowEmergencyModal(false);
          hookHandleCallStart(astro, "video", true);
        }}
      />
    </div>
  );
};

export default Astrologers;
