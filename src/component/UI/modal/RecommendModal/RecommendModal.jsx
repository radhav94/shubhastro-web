import { useGetRecommendedAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";
import RecommendedCard from "./RecommendedCard";
import styles from "./recommendModal.module.scss";
import { IoClose } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { Toast } from "../../..";
import { useCall } from "../../../../context/CallContext";
import { useWalletBalance } from "../../../../screens/private/wallet/useWalletBalance";
import { getToken } from "../../../../utils/token";
import { voiceSocket } from "../../../../services/voiceSocketServices";
import { useCreateChatRoomMutation } from "../../../../redux/api/chatApi";
import { useNavigate, useLocation } from "react-router-dom";
import WaitingModal from "../waitingModal/WaitingModal";
import KundliSelectModal from "../../../../screens/private/talkToAstrologer/kundliSelect/KundliSelectModal";
import PrimaryLoader from "../../PrimaryLoader";
import { useTalkToAstrologer } from "../../../../screens/private/talkToAstrologer/useTalkToAstrologer";
import { useGetBalanceMutation } from "../../../../redux/api/wallet/walletApi";
import { useChat } from "../../../../context/ChatContext";

const RecommendModal = ({ open, onClose, mode = "chat", setOpen }) => {
  const { data: recommendedAstros, isLoading } =
    useGetRecommendedAstrologersQuery();

  // if (!open) return null;

  const navigate = useNavigate();

  const location = useLocation(); //  get current URL
  const currentPath = location.pathname.split("/").pop();

  const [
    onFollow,
    openModal,
    setOpenModal,
    onChat,
    onProfile,
    handleSubmit,
    onRechargeNow,
  ] = useTalkToAstrologer();

  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [waitingPopup, setWaitingPopup] = useState(false); //

  const { activeCall, setActiveCall } = useCall();
  const {
    setActiveChat,
    setWaitingList,
    WaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setLastRequestedAstro,
  } = useChat();

  // ✅ Ref for current calling astrologer (no re-render)
  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null); // selected kundliId

  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);

  const [createChatRoom] = useCreateChatRoomMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  // last part of URL

  // Detect type based on URL
  const getTypeFromURL = () => {
    if (currentPath.includes("chat")) return "chat";
    if (currentPath.includes("talk")) return "video,audio";
    return "chat"; // default fallback
  };

  // 🔥 Set initial activeType from URL
  const [activeType, setActiveType] = useState(getTypeFromURL());

  // 🔄 Update activeType if URL changes
  useEffect(() => {
    setActiveType(getTypeFromURL());
    if (!location.state?.rejoinAstro) return;
    handleChatStart(location.state.rejoinAstro);
    navigate(".", { replace: true, state: null });
  }, [location]);

  const token = getToken();
  const { balance } = useWalletBalance();
  const [getBalance] = useGetBalanceMutation();

  // Kundli & Chat handlers
  const openKundliPopup = () => {
    if (token) {
      setKundliModalOpen(true);
    } else {
      navigate("/login", { state: { from: location.pathname } });
    }
  };

  async function handleChatStart(astro) {
    setSelectedAstrologer(astro);
    setLastRequestedAstro(astro);
    //Check if user has minimum required balance
    // 💰 Balance check
    const result = await getBalance({ astrologerId: astro?._id });
    if (result.data.data.status === false) {
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return;
    }

    //Check if astro is online
    if (!astro?.isActive) {
      Toast.error("Astrologer is not online");
      return;
    }

    openKundliPopup();
  }

  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);

    if (!kundli?._id) return Toast.error("Kundli not selected properly");
    if (!selectedAstrologer?._id) return Toast.error("Astrologer not selected");
    if (!userIdLocal) return Toast.error("User ID Missing");

    const astro = selectedAstrologer;
    localStorage.setItem("selectedAstroId", astro._id);

    try {
      // 🔐 Auth check
      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

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

  /* ------------------- SOCKET CALL FLOW (ADDED ONLY) ------------------- */

  useEffect(() => {
    if (!userIdLocal) return;

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
  }, [userIdLocal]);

  const resetCallState = () => {
    setWaitingPopup(false);
    setCallRoomId(null);
    setChatRoomId(null);

    activeCallAstroRef.current = null;
    kundliRef.current = null;

    setActiveCall(null);
  };

  const initiateCall = (astro, type) => {
    // 🔐 Auth check
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // ❌ Validations
    if (!astro) return Toast.error("Astrologer missing");
    if (!userIdLocal) return Toast.error("User ID missing");

    // 💰 Balance check
    const price = astro?.price?.amount || 0;
    if (balance < price) {
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
    setWaitingPopup(true);

    // 🔌 Ensure socket connection
    // connectSocket();

    // 🚀 Create call room
    voiceSocket.emit("create_call_room", {
      userId: userIdLocal,
      astrologerId: astro._id,
      type, // "audio" | "video"
    });
  };

  const handleAudioCall = (astro) => {
    initiateCall(astro, "audio");
  };

  const handleVideoCall = (astro) => {
    initiateCall(astro, "video");
  };

  useEffect(() => {
    if (!userIdLocal) return;

    /* Room ready event */
    const handleReturnRoom = ({ roomId }) => {
      setCallRoomId(roomId);
      setWaitingPopup(true);
    };

    const handleChatRoom = (data) => {
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingPopup(false);
      setWaitingList(data?.waitingTime || 2);
    };

    const handleCallAccepted = async ({ roomId, token, type }) => {
      setWaitingPopup(false);

      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;

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
        });
      } catch {
        Toast.error("Failed to start chat");
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
        });

        navigate(`/talk-to-astrologers/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: astro.firstName,
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: data?.astrologer?.firstName || "",
            astroID: data?.astrologer?.astrologer_ID,
          },
        });
      } catch {
        Toast.error("Failed to start chat");
      }
    };
    /* REJECTED */
    const handleCallRejected = (data) => {
      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected"
          ? "Astrologer has rejected the chat request"
          : "Call rejected";
      Toast.error(errorMsg);
      resetCallState();
      resetChatFlow();
    };

    /* ERROR */
    const handleSocketError = (err) => {
      console.log("SOCKET ERROR:", err);

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
    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call_accepted", handleCallAccepted);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("chat:rejected", handleCallRejected);
    voiceSocket.on("call_rejected", handleCallRejected);
    voiceSocket.on("error", handleSocketError);
    voiceSocket.on("call_ended", handleCallEnded);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call_accepted", handleCallAccepted);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("chat:rejected", handleCallRejected);
      voiceSocket.off("call_rejected", handleCallRejected);
      voiceSocket.off("error", handleSocketError);
      voiceSocket.off("call_ended", handleCallEnded);
    };
  }, [userIdLocal]);

  return (
    <>
      {waitingPopup && (
        <WaitingModal callRoomId={callRoomId} resetCallState={resetCallState} />
      )}
      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={handleChatAfterKundliSelect}
      />
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
                  // onChat={() => openKundliPopup(astro)}
                  onChat={() => handleChatStart(astro)}
                  // onProfile={() => onProfile(astro)}
                  onAudioCall={() => handleAudioCall(astro)}
                  onVideoCall={() => handleVideoCall(astro)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecommendModal;
