// Astrologers.jsx
import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import styles from "./Astrologers.module.scss";
import {
  AstrologerCard,
  RechargeModal,
  Title,
  Toast,
} from "../../../../../component";
import { useCreateChatRoomMutation } from "../../../../../redux/api/chatApi";
import { useGetAstrologersQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import { getToken } from "../../../../../utils/token";
import { PATH } from "../../../../../utils/routes/Paths";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";
import { useGetBalanceMutation } from "../../../../../redux/api/wallet/walletApi";
import { useChat } from "../../../../../context/ChatContext";
import { useAstrologerConnect } from "../../../../../utils/hooks/useAstrologerConnect";
import ConnectAstrologerPopup from "../../../v2/components/ui/ConnectAstrologerPopup";
import ProfileModals from "../../../kundli/components/ProfileModals";
import { useProfileManager } from "../../../kundli/hooks/useProfileManager";

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
    formatProfileDisplay,
  } = useProfileManager(dispatch);

  // Local state for selected profile (to avoid closing modal)
  const [localSelectedProfile, setLocalSelectedProfile] = useState(null);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);

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
    };

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
    };

    const handleCallAccepted = async ({ roomId, token, type, remainingTime, isSwitch }) => {
      // If this is a switch from audio to video, let CallContext handle it
      if (isSwitch && type === "video") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch");
        resetCallFlow();
        return;
      }
      
      // Regular call acceptance
      resetCallFlow();
      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;

      try {
        setActiveCall({
          roomId,
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
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-with-astrologers/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
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

    const handleCallRejected = (data) => {
      // Check if this is a video switch rejection during an active audio call
      if (data?.switchRejected && data?.type === "audio") {
        console.log("🔄 Video switch rejected - audio call continues");
        // Don't reset anything - the audio call should continue
        return;
      }
      
      // Regular call rejection - end everything
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
        connectionType="chat"
      />

      {/* Connect Astrologer Popup */}
      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={() => setIsConnectPopupOpen(false)}
        astrologer={selectedAstrologer}
        onChatStart={hookHandleChatStart}
        onCallStart={hookHandleCallStart}
      />
    </div>
  );
};

export default Astrologers;
