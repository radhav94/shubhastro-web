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
import { useNavigate,useLocation } from "react-router-dom";
import WaitingModal from "../waitingModal/WaitingModal";
import KundliSelectModal from "../../../../screens/private/talkToAstrologer/kundliSelect/KundliSelectModal";

const RecommendModal = ({ open, onClose, mode = "chat" }) => {
  const { data: recommendedAstros } = useGetRecommendedAstrologersQuery();

  if (!open) return null;

  const navigate = useNavigate();
  const { activeCall, setActiveCall } = useCall();
  const [waitingPopup, setWaitingPopup] = useState(false);
  const [callRoomId, setCallRoomId] = useState(null);
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);

  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null);

  const token = getToken();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const { balance } = useWalletBalance();

  const [createChatRoom] = useCreateChatRoomMutation();
  const location = useLocation(); // 👈 get current URL
  const currentPath = location.pathname.split("/").pop(); // last part of URL

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
  }, [location.pathname]);
  // Kundli & Chat handlers
  const openKundliPopup = (astro) => {
    setSelectedAstrologer(astro);
    if (token) {
      setKundliModalOpen(true);
    } else {
      navigate("/login", { state: { from: location.pathname } });
    }
  };

  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);

    if (!kundli?._id) return Toast.error("Kundli not selected properly");
    if (!selectedAstrologer?._id) return Toast.error("Astrologer not selected");
    if (!userIdLocal) return Toast.error("User ID Missing");

    const astro = selectedAstrologer;
    localStorage.setItem("selectedAstroId", astro._id);

    try {
      const res = await createChatRoom({
        userId: userIdLocal,
        astrologerId: astro._id,
      });

      const roomId = res?.data?.data;
      if (!roomId) return Toast.error("Room ID missing");

      navigate(`/talk-to-astrologers/${astro._id}`, {
        state: {
          userId: userIdLocal,
          astrologerId: astro._id,
          fullName: astro.firstName,
          roomId,
          isUserSide: true,
          kundliId: kundli._id,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  /* SOCKET CALL FLOW*/
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
      voiceSocket.off(); // remove listeners only
    };
  }, [userIdLocal]);

  const resetCallState = () => {
    setWaitingPopup(false);
    setCallRoomId(null);

    activeCallAstroRef.current = null;
    kundliRef.current = null;

    setActiveCall(null);
  };

  const initiateCall = (astro, type) => {
    //  Auth check
    if (!token) {
      navigate("/login", { state: { from: location?.pathname } });
      return;
    }

    //  Validations
    if (!astro) return Toast.error("Astrologer missing");
    if (!userIdLocal) return Toast.error("User ID missing");

    //  Balance check
    const price = astro?.price?.amount || 0;
    if (balance < price) {
      setSelectedAstrologer(astro);
      // setOpenModal((prev) => ({ ...prev, recharge: true }));
      // return;
    }

    //  Already on call
    if (activeCall) {
      return Toast.error("You are already on a call");
    }

    // Store active call info
    activeCallAstroRef.current = astro;
    setWaitingPopup(true);

    //  Create call room
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

    /* REJECTED */
    const handleCallRejected = (data) => {
      Toast.error(data?.sessionData?.sessionEndReason || "Call rejected");
      resetCallState();
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
    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call_accepted", handleCallAccepted);
    voiceSocket.on("call_rejected", handleCallRejected);
    voiceSocket.on("error", handleSocketError);
    voiceSocket.on("call_ended", handleCallEnded);

    return () => {
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call_accepted", handleCallAccepted);
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
                  onChat={() => openKundliPopup(astro)}
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
