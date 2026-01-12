// Astrologers.jsx
import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Astrologers.module.scss";
import {
  AstrologerCard,
  RechargeAlertModel,
  Title,
  Toast,
} from "../../../../../component";
import { useCreateChatRoomMutation } from "../../../../../redux/api/chatApi";
import KundliSelectModal from "../../../talkToAstrologer/kundliSelect/KundliSelectModal";
import { useGetAstrologersQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import { getToken } from "../../../../../utils/token";
import { PATH } from "../../../../../utils/routes/Paths";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";
import WaitingPopup from "../../components/chats/WaitingPopup";
import { useGetBalanceMutation } from "../../../../../redux/api/wallet/walletApi";
import { useChat } from "../../../../../context/ChatContext";

const Astrologers = ({ title, astrologers = [], onClickView, onProfile }) => {
  const navigate = useNavigate();
  const [callType, setCallType] = useState(null); // audio | video
  const [isChatMode, setIsChatMode] = useState(true);
  const {
    activeCall,
    setActiveCall,
    setWaitingList: setCallWaitingList,
    setActiveCallRoomId,
    resetCallFlow,
    setLastCallType,
    setLastSelectedKundli,
    setLastRequestedAstro: setLastRequestedCallAstro,
    setCallSeconds
  } = useCall();
  const { setActiveChat, setWaitingList, WaitingList, resetChatFlow, activeChatRoomId, setActiveChatRoomId, setLastRequestedAstro, lastRequestedAstro, setChatSeconds } = useChat();

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
      : apiResponse?.data || [];

  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [openModal, setOpenModal] = useState({ recharge: false });

  const [selectedAstro, setSelectedAstro] = useState(null);
  const [waitingPopup, setWaitingPopup] = useState(false);
  const [callRoomId, setCallRoomId] = useState(null);

  // 🔹 ADDED: arrow disable states
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const [createChatRoom] = useCreateChatRoomMutation();
  const [getBalance] = useGetBalanceMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const scrollRef = useRef(null);

  const token = getToken();

  //  track which astrologer user is calling
  const [activeCallAstro, setActiveCallAstro] = useState(null);
  //  keep astro in ref (important)
  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null);

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

  // ---------------- CHAT FLOW ----------------

  const openKundliPopup = () => {
    if (token) setKundliModalOpen(true);
    else navigate("/login");
  };

  async function handleChatStart(astro) {
    setSelectedAstro(astro);
    setLastRequestedAstro(astro);

    const result = await getBalance({ astrologerId: astro?._id });
    if (result.data.data.status === false) {
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return;
    }

    openKundliPopup();
  }

  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);

    if (!kundli?._id) return Toast.error("Kundli not selected properly");
    kundliRef.current = kundli._id;
    setLastSelectedKundli(kundli); // Store the selected Kundli in context
    if (!selectedAstro?._id) return Toast.error("Astrologer not selected");
    if (!userIdLocal) return Toast.error("User ID Missing");

    const astro = selectedAstro;
    localStorage.setItem("selectedAstroId", astro._id);

    try {
      // 🔐 Auth check
      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      if (!isChatMode) return initiateCall(astro, callType);
      // ✅ Store active call info
      activeCallAstroRef.current = astro;
      setWaitingPopup(true);
      kundliRef.current = kundli?._id;

      // 🚀 Create call room
      voiceSocket.emit("chat:initiate", {
        userId: userIdLocal,
        astrologerId: astro._id,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const initiateCall = async (astro, type) => {
    // 🔐 Auth check
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // ❌ Validations
    if (!astro) return Toast.error("Astrologer missing");
    if (!userIdLocal) return Toast.error("User ID missing");

    // 💰 Balance check
    const res = await getBalance({ astrologerId: astro._id, type: "call" });
    if (
      !res?.data?.data?.status ||
      res?.data?.data?.availableAmount < res?.data?.data?.requiredAmount
    ) {
      setSelectedAstrologer(astro);
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return;
    }

    // 📞 Already on call
    if (activeCall) {
      return Toast.error("You are already on a call");
    }

    // ✅ Store active call info
    activeCallAstroRef.current = astro;
    setActiveCallAstro(astro);
    setCallType(type);
    setLastCallType(type); // Store the call type in context
    setCallWaitingList(5); // Show waiting for call

    // 🔌 Ensure socket connection
    // connectSocket();

    // 🚀 Create call room
    voiceSocket.emit("call:initiate", {
      userId: userIdLocal,
      astrologerId: astro._id,
      type, // "audio" | "video"
    });
  };

  async function handleChatStart(astro) {
    setSelectedAstro(astro);
    setLastRequestedAstro(astro);
    //Check if user has minimum required balance
    const result = await getBalance({ astrologerId: astro?._id });
    if (result.data.data.status === false) {
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return;
    }

    openKundliPopup();
  }


  // ---------------- AUDIO CALL ----------------

  //  AUDIO CALL – same pattern as TalkToAstrologer / ChatWindow
  const handleAudioCall = (astro) => {
    if (activeCall) {
      return Toast.error("You are already on a call");
    }

    if (!astro) return;
    if (!token) return navigate("/login");
    if (!userIdLocal) return;

    setActiveCallAstro(astro);
    setWaitingPopup(true); //  Show popup
    activeCallAstroRef.current = astro;
    setWaitingPopup(true);

    voiceSocket.emit("create_call_room", {
      userId: userIdLocal,
      astrologerId: astro._id,
      type: "audio",
    });
  };

  const handleVideoCall = (astro) => {
    if (activeCall) {
      return Toast.error("You are already on a call");
    }

    if (!astro) return;
    if (!token) return navigate("/login");
    if (!userIdLocal) return;

    activeCallAstroRef.current = astro;
    setWaitingPopup(true);

    voiceSocket.emit("create_call_room", {
      userId: userIdLocal,
      astrologerId: astro._id,
      type: "video",
    });
  };

  const handleCallStart = async (astro, type) => {
    setSelectedAstro(astro);
    setLastRequestedCallAstro(astro);
    //Check if user has minimum required balance
    // 💰 Balance check
    const result = await getBalance({ astrologerId: astro?._id, type: "call" });
    if (result.data.data.status === false) {
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return;
    }

    //Check if astro is online
    if (!astro?.isActive) {
      Toast.error("Astrologer is not online");
      return;
    }

    setCallType(type);
    openKundliPopup();
    setIsChatMode(false);
  };

  const cancelCall = () => {
    const astro = activeCallAstroRef.current;

    setWaitingPopup(false);
    setCallRoomId(null);
    activeCallAstroRef.current = null;

    setActiveCall(null);

    if (astro?._id) {
      voiceSocket.emit("cancel_call", {
        userId: userIdLocal,
        astrologerId: astro._id,
      });
    }
  };

  // ---------------- SOCKET LISTENERS ----------------

  useEffect(() => {
    if (!userIdLocal) return;

    const handleReturnRoom = ({ roomId }) => {
      if (!roomId) return;
      setWaitingPopup(true);
    };

    const handleChatRoom = (data) => {
      setActiveChatRoomId(data?.roomId);
      setWaitingPopup(false);
      setWaitingList(data?.waitingTime || 2);
    };

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
    };

    const handleCallAccepted = async ({ roomId, token, type, remainingTime }) => {
      setWaitingPopup(false);
      resetCallFlow();
      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;
      if (!astro) return;

      //  START CALL GLOBALLY (NO NAVIGATION)
      try {
        const res = await createChatRoom({
          userId: userIdLocal,
          astrologerId: astro._id,
        });

        const chatRoomId = res?.data?.data;
        if (!chatRoomId) throw new Error();

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
          remainingTime
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
      const kundliId = kundliRef.current;

      try {
        if (!roomId) throw new Error();

        setActiveChat({
          roomId,
          activeChatRoomId,
          callerName: data?.astrologer?.firstName,
          isUserSide: true,
          userId: userIdLocal,
          astrologerId: astrologerId,
          kundliId,
          astrologerName: data?.astrologer?.firstName || "",
          remainingTime: data?.remainingTime
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-with-astrologers/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: data?.astrologer?.firstName,
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: data?.astrologer?.firstName || "",
            astroID: data?.astrologer?.astrologer_ID
          },
        });
      } catch (e) {
        console.log('e', e)
        Toast.error("Failed to start chat");
      }
    };

    const handleCallRejected = (data) => {
      if (activeCallAstroRef.current === null) return;
      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected"
          ? "Astrologer has rejected the chat request"
          : "Call rejected";
      Toast.error(errorMsg);
      setWaitingPopup(false);
      activeCallAstroRef.current = null;
      resetChatFlow();
    };

    const handleCallEnded = () => {
      setWaitingPopup(false);
      activeCallAstroRef.current = null;
    };

    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("chat:rejected", handleCallRejected);
    voiceSocket.on("call:rejected", handleCallRejected);
    voiceSocket.on("call:ended", handleCallEnded);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("chat:rejected", handleCallRejected);
      voiceSocket.off("call:rejected", handleCallRejected);
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

      {waitingPopup && (
        <WaitingPopup
          callRoomId={callRoomId}
          onCancel={cancelCall}
        />
      )}

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
      <div className={`${styles.cardsContainer} ${astrologers?.length > 3 ? styles.scrollMode : ""
        }`}
        ref={scrollRef}>
        {astrologers?.map((astrologer) => (
          <div key={astrologer._id} className={styles.cardWrapper}>
            <AstrologerCard
              data={astrologer}
              onChat={() => handleChatStart(astrologer)}
              onProfile={() => onProfile(astrologer)}
              onAudioCall={() => handleCallStart(astrologer, "audio")}
              onVideoCall={() => handleCallStart(astrologer, "video")}
              disabled={!!activeCall} //  optional UX improvement
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
      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={handleChatAfterKundliSelect}
      />

      <RechargeAlertModel
        onClose={() => setOpenModal({ recharge: false })}
        isOpen={openModal.recharge}
        handleSubmit={() => navigate(PATH.privateRoutes.RECHARGE.path)}
        astrologer={selectedAstro}
      />
    </div>
  );
};

export default Astrologers;
