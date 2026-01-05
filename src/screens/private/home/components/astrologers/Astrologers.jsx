// Astrologers.jsx
import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Astrologers.module.scss";
import {
  AstrologerCard,
  PrimaryText,
  RechargeAlertModel,
  Title,
} from "../../../../../component";
import { useCreateChatRoomMutation } from "../../../../../redux/api/chatApi";
import KundliSelectModal from "../../../talkToAstrologer/kundliSelect/KundliSelectModal";
import { useGetAstrologersQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import { getToken } from "../../../../../utils/token";
import { PATH } from "../../../../../utils/routes/Paths";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";
import { Toast } from "../../../../../component";

const Astrologers = ({title,astrologers = [],onClickView,onProfile,}) => {
  const navigate = useNavigate();
  const { activeCall, setActiveCall } = useCall();

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

  const [createChatRoom] = useCreateChatRoomMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const scrollRef = useRef(null);

  const token = getToken();

  //  track which astrologer user is calling
  const [activeCallAstro, setActiveCallAstro] = useState(null);
  //  keep astro in ref (important)
  const activeCallAstroRef = useRef(null);

  // ---------------- CHAT FLOW ----------------

  const openKundliPopup = (astro) => {
    setSelectedAstro(astro);
    if (token) setKundliModalOpen(true);
    else navigate("/login");
  };

  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);

    const astro = selectedAstro;
    const res = await createChatRoom({
      userId: userIdLocal,
      astrologerId: astro._id,
    });

    const roomId = astrologers || res?.data?.data;

    navigate(`/talk-to-astrologers/${astro._id}`, {
      state: {
        userId: userIdLocal,
        astrologerId: astro._id,
        fullName: astro.firstName,
        roomId,
        kundliId: kundli._id,
        isUserSide: true,
      },
    });
  };

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

  // ---------------- SOCKET LISTENERS ----------------

  useEffect(() => {
    if (!userIdLocal) return;

    const handleReturnRoom = ({ roomId }) => {
      if (!roomId) return;
      setWaitingPopup(true);
    };

    const handleCallAccepted = ({ roomId, token, type }) => {
      setWaitingPopup(false);

      const astro = activeCallAstroRef.current;
      if (!astro) return;

      //  START CALL GLOBALLY (NO NAVIGATION)
      setActiveCall({
        roomId,
        agoraToken: token,
        callerName: astro.firstName,
        isUserSide: true,
        callType: type, // "audio" or "video"
      });
    };

    const handleCallRejected = (data) => {
      Toast.error(data?.sessionData?.sessionEndReason || "Call rejected");
      setWaitingPopup(false);
      activeCallAstroRef.current = null;
    };

    const handleCallEnded = () => {
      setWaitingPopup(false);
      activeCallAstroRef.current = null;
    };

    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call_accepted", handleCallAccepted);
    voiceSocket.on("call_rejected", handleCallRejected);
    voiceSocket.on("call_ended", handleCallEnded);

    return () => {
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call_accepted", handleCallAccepted);
      voiceSocket.off("call_rejected", handleCallRejected);
      voiceSocket.off("call_ended", handleCallEnded);
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <PrimaryText size_18 isSemiBold>
              🔔 Calling Astrologer…
            </PrimaryText>

            <PrimaryText size_14 color="#777">
              Please wait while astrologer accepts the call
            </PrimaryText>

            <div className={styles.modalButtons}>
              <button
                className={styles.rejectBtn}
                onClick={() => {
                  setWaitingPopup(false);
                  activeCallAstroRef.current = null;
                  voiceSocket.emit("cancel_call");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
       {astrologers?.length > 3 && (
        <button className={styles.leftArrow} onClick={scrollLeft}>
          &lt;
        </button>
      )}
      <div className={`${styles.cardsContainer} ${
            astrologers?.length > 3 ? styles.scrollMode : ""
        }`}
        ref={scrollRef}>
        {astrologers?.map((astrologer) => (
          <div key={astrologer._id} className={styles.cardWrapper}>
            <AstrologerCard
              data={astrologer}
              onChat={() => openKundliPopup(astrologer)}
              onProfile={() => onProfile(astrologer)}
              onAudioCall={() => handleAudioCall(astrologer)}
              onVideoCall={() => handleVideoCall(astrologer)}
              disabled={!!activeCall} //  optional UX improvement
              isLayoutClassic={false}
            />
          </div>
        ))}
      </div>
      {astrologers?.length > 3 && (
        <button className={styles.rightArrow} onClick={scrollRight}>
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
