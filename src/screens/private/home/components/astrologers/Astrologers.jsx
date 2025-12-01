// Astrologers.jsx
import { useCallback, useState } from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Astrologers.module.scss";
import {
  AstrologerCard,
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

  const [createChatRoom] = useCreateChatRoomMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const token = getToken();
  const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
    amount: 0,
  };

  // ⭐ track which astrologer user is calling
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
  // ⭐ AUDIO CALL – same pattern as TalkToAstrologer / ChatWindow
  const handleAudioCall = (astro) => {
    if (!astro) return;

    if (!token) {
      // if not logged in, same behavior as chat
      return navigate("/login");
    }

    if (!userIdLocal) return; // optionally show toast

    setActiveCallAstro(astro);

    // 1️⃣ ask backend to create a call room
    voiceSocket.emit("create_call_room", {
      userId: userIdLocal,
      astrologerId: astro._id,
    });
  };

  // 2️⃣ listen for room + call accepted
  useEffect(() => {
  if (!userIdLocal) return;

  const handleReturnCallRoom = ({ roomId }) => {
    if (!roomId || !activeCallAstro?._id) return;

    // Notify astrologer of incoming call
    voiceSocket.emit("notify_incoming_call", {
      roomId,
      to: activeCallAstro._id, // astrologerId from state
      from: userIdLocal,       // userId known from storage
    });
  };

  const handleCallAccepted = ({ roomId }) => {
    if (!roomId) return;

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
}, [userIdLocal, activeCallAstro, navigate]);


  return (
    <div className={styles.astrologersWrapper}>
      <Title
        title="Top Online Astrologers"
        showDivider
        showButton
        buttonTitle="View All"
        onButtonClick={onClickView}
      />

      <div className={styles.cardsContainer}>
        {data?.data?.map((astrologer) => (
          <div key={astrologer._id} className={styles.cardWrapper}>
            <AstrologerCard
              data={astrologer}
              onChat={() => openKundliPopup(astrologer)}
              onProfile={() => onProfile(astrologer)}
              onAudioCall={() => handleAudioCall(astrologer)} // ⭐ updated
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
