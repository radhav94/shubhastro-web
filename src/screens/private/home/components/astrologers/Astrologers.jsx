// Astrologers.jsx
import { useCallback, useState, useEffect } from "react";
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

const Astrologers = ({ onClickView, onProfile }) => {
  const navigate = useNavigate();

  const page = 1;
  const limit = 3;
  const { data } = useGetAstrologersQuery({ page, limit });

  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [openModal, setOpenModal] = useState({
    recharge: false,
  });

  const [selectedAstro, setSelectedAstro] = useState(null);
  const [waitingPopup, setWaitingPopup] = useState(false); //  waiting state added

  const [createChatRoom] = useCreateChatRoomMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const token = getToken();
  const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
    amount: 0,
  };

  //  track which astrologer user is calling
  const [activeCallAstro, setActiveCallAstro] = useState(null);

  // Step 1: On Chat => open Kundli Modal
  const openKundliPopup = (astro) => {
    setSelectedAstro(astro);
    // if (token && storedWallet?.amount >= 135) {
    //   setKundliModalOpen(true);
    // }
    if (token) {
      setKundliModalOpen(true);
    }
    // else if (token) {
    //   setOpenModal((prev) => ({ ...prev, recharge: true }));
    // }
    else {
      navigate("/login", { state: { from: location.pathname } });
    }
  };

  // Step 2: After selecting Kundli => Create Chat Room
  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);

    const astro = selectedAstro;
    localStorage.setItem("selectedAstroId", astro._id);

    const res = await createChatRoom({
      userId: userIdLocal,
      astrologerId: astro._id,
    });

    const roomId = res?.data?.data;

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

  const onRechargeNow = useCallback(() => {
    setOpenModal((prev) => ({ ...prev, recharge: false }));
    navigate(PATH.privateRoutes.RECHARGE.path);
  }, [navigate]);

  //  AUDIO CALL – same pattern as TalkToAstrologer / ChatWindow
  const handleAudioCall = (astro) => {
    if (!astro) return;
    if (!token) return navigate("/login");
    if (!userIdLocal) return;

    setActiveCallAstro(astro);
    setWaitingPopup(true); //  Show popup

    voiceSocket.emit("create_call_room", {
      userId: userIdLocal,
      astrologerId: astro._id,
    });
  };

  useEffect(() => {
    if (!userIdLocal) return;

    const handleReturnCallRoom = ({ roomId }) => {
      if (!roomId || !activeCallAstro?._id) return;

      voiceSocket.emit("notify_incoming_call", {
        roomId,
        to: activeCallAstro._id,
        from: userIdLocal,
      });
    };

    const handleCallAccepted = ({ roomId }) => {
      setWaitingPopup(false); //  Hide popup
      const callerName = activeCallAstro?.firstName || "Astrologer";

      navigate(`/talk-to-astrologers/voice-call/${roomId}`, {
        state: {
          roomId,
          callerName,
          userId: userIdLocal,
          astrologerId: activeCallAstro?._id,
          isUserSide: true,
        },
      });
    };

    voiceSocket.on("return_call_room", handleReturnCallRoom);
    voiceSocket.on("call_accepted", handleCallAccepted);

    return () => {
      voiceSocket.off("return_call_room", handleReturnCallRoom);
      voiceSocket.off("call_accepted", handleCallAccepted);
    };
  }, [activeCallAstro]);

  return (
    <div className={styles.astrologersWrapper}>
      <Title
        title="Top Online Astrologers"
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
                  voiceSocket.emit("cancel_call", {
                    astrologerId: activeCallAstro?._id,
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.cardsContainer}>
        {data?.data?.map((astrologer) => (
          <div key={astrologer._id} className={styles.cardWrapper}>
            <AstrologerCard
              data={astrologer}
              onChat={() => openKundliPopup(astrologer)}
              onProfile={() => onProfile(astrologer)}
              onAudioCall={() => handleAudioCall(astrologer)} //  updated
            />
          </div>
        ))}
      </div>

      {/* Kundli Select Modal */}
      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={(kundli) => handleChatAfterKundliSelect(kundli)}
      />
      <RechargeAlertModel
        onClose={() => setOpenModal((prev) => ({ ...prev, recharge: false }))}
        isOpen={openModal.recharge}
        handleSubmit={onRechargeNow}
        astrologer={selectedAstro}
      />
    </div>
  );
};

export default Astrologers;
