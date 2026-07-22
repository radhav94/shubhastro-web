import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import dayjs from "dayjs";
import DateTimePicker from "../../../component/UI/dateTimePicker/DateTimePicker";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import OtpModal from "../../../component/UI/Profile/OtpModal";
import GuestMatchModal from "./GuestMatchModal";
import { PrimaryText, Toast } from "../../../component";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { useChat } from "../../../context/ChatContext";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";
import { getAstrologerDefaultImage } from "../../../utils/appImages";
import { getToken } from "../../../utils/token";
import { capitalizeWords } from "../../../utils/capitalize";
import { GUEST_AUTO_ACCEPT_KEY } from "./guestChatConstants";
import { useGuestChatAuth } from "./useGuestChatAuth";
import ChatMessages from "../../private/home/components/chats/ChatMessages";
import chat from "../../private/home/components/chats/ChatWindow.module.scss";
import styles from "./GuestChatFlow.module.scss";

// Ordered questions the bot asks. Each maps to a field on the collected details.
const STEPS = [
  {
    key: "name",
    type: "text",
    question: "Hi! I'm here to connect you with your astrologer. What's your name?",
    placeholder: "Enter your full name",
    validate: (v) =>
      !v?.trim()
        ? "Please enter your name"
        : !/^[A-Za-z\s]+$/.test(v.trim())
        ? "Name can only contain letters and spaces"
        : null,
    format: (v) => v.trim(),
  },
  {
    key: "identity",
    type: "gender",
    question: (d) => `Nice to meet you, ${d.name?.split(" ")[0] || "there"}! What's your gender?`,
    validate: (v) => (!v ? "Please select your gender" : null),
  },
  {
    key: "birthDate",
    type: "date",
    question: "What's your date of birth?",
    validate: (v) => (!v ? "Please select your date of birth" : null),
  },
  {
    key: "birthTime",
    type: "time",
    question: "What time were you born? (This helps with accurate predictions)",
    validate: () => null,
  },
  {
    key: "birthPlace",
    type: "place",
    question: "Where were you born? Search and pick your birth place.",
    validate: (v, d) =>
      !v?.trim()
        ? "Please select your place of birth"
        : !d.latitude || !d.longitude
        ? "Please pick a location from the dropdown"
        : null,
  },
  {
    key: "mobileNumber",
    type: "mobile",
    question: "Almost done! Enter your mobile number to receive an OTP.",
    placeholder: "10-digit mobile number",
    validate: (v) =>
      !/^[6-9]\d{9}$/.test(v || "") ? "Enter a valid 10-digit mobile number" : null,
  },
];

const INITIAL_DETAILS = {
  name: "",
  identity: "",
  birthDate: "",
  birthTime: "",
  unknownBirthTime: false,
  birthPlace: "",
  latitude: null,
  longitude: null,
  timezone: 5.5,
  mobileNumber: "",
};

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();

// Backend expects dateOfBirth as YYYY-MM-DD (same as the AI Wow guest flow).
const toYMD = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateDisplay = (date) =>
  date
    ? `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
    : "";

const SendButton = ({ onClick, disabled }) => (
  <button className={chat.sendButton} onClick={onClick} disabled={disabled} aria-label="Send" type="button">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 20 17" fill="none">
      <path
        d="M1.4 16.8849L18.85 9.40488C19.66 9.05488 19.66 7.91488 18.85 7.56488L1.4 0.0848801C0.74 -0.20512 0.00999999 0.28488 0.00999999 0.99488L0 5.60488C0 6.10488 0.37 6.53488 0.87 6.59488L15 8.48488L0.87 10.3649C0.37 10.4349 0 10.8649 0 11.3649L0.00999999 15.9749C0.00999999 16.6849 0.74 17.1749 1.4 16.8849Z"
        fill="#FEFEFE"
      />
    </svg>
  </button>
);

const GuestChatFlow = () => {
  const { astrologerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { setActiveChat, setChatSeconds } = useChat();
  const { addPendingConnection, removePendingConnection } = useWaitingQueue();
  const { sendOtp, resendOtp, verifyAndRegister, verifying } = useGuestChatAuth();

  const astroFromState = location.state?.astrologer || null;
  const { data: astroApi } = useGetAstrologerByIdQuery(
    { id: astrologerId },
    { skip: !astrologerId || !!astroFromState }
  );
  const astrologer = astroFromState || astroApi?.data || null;
  const astrologerRef = useRef(astrologer);
  astrologerRef.current = astrologer;

  const astroName = `${astrologer?.firstName || ""} ${astrologer?.lastName || ""}`.trim() || "Astrologer";
  const astroImg = astrologer?.profileImgUrl || getAstrologerDefaultImage(astrologer?.gender);
  const [imgError, setImgError] = useState(false);

  const [phase, setPhase] = useState("collecting"); // collecting | otp | connecting | waiting
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [details, setDetails] = useState(INITIAL_DETAILS);

  const [textDraft, setTextDraft] = useState("");
  const [dateDraft, setDateDraft] = useState(null);
  const [timeDraft, setTimeDraft] = useState(null);
  const [inputError, setInputError] = useState("");

  const [showMatch, setShowMatch] = useState(false);
  const roomIdRef = useRef(null);
  const matchTimerRef = useRef(null);
  const messagesRef = useRef(null);
  const detailsRef = useRef(details);
  detailsRef.current = details;

  const currentStep = STEPS[stepIndex];

  const pushMessage = (text, isSender, extra = {}) =>
    setMessages((m) => [
      ...m,
      {
        id: `${isSender ? "u" : "b"}-${Date.now()}-${Math.random()}`,
        text,
        isSender,
        time: nowTime(),
        date: dayjs().format("MMM DD, YYYY"),
        dateTime: new Date().toISOString(),
        ...extra,
      },
    ]);
  const pushBot = (text, extra) => pushMessage(text, false, extra);
  const pushUser = (text) => pushMessage(text, true);

  // A logged-in user must never stay in the guest flow — e.g. after refreshing
  // the page once they've been registered mid-flow. Send them out to the
  // astrologer's page (or the listing) and replace history so Back won't return
  // to the guest window.
  useEffect(() => {
    if (getToken()) {
      navigate(astrologerId ? `/astrologer/${astrologerId}` : "/astrologers", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed the first question on mount.
  useEffect(() => {
    if (messages.length === 0) {
      const q = STEPS[0].question;
      pushBot(typeof q === "function" ? q(details) : q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTyping = phase === "connecting" || phase === "waiting";

  // Keep the transcript pinned to the newest message / typing indicator.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const askStep = (index) => {
    const step = STEPS[index];
    if (!step) return;
    const q = step.question;
    const text = typeof q === "function" ? q(detailsRef.current) : q;
    pushBot(text);
  };

  const goToStep = (nextIndex, updatedDetails) => {
    setStepIndex(nextIndex);
    setInputError("");
    setTextDraft("");
    setDateDraft(null);
    setTimeDraft(null);
    if (nextIndex < STEPS.length) {
      setTimeout(() => askStep(nextIndex), 250);
    } else {
      beginOtp(updatedDetails);
    }
  };

  const commitAnswer = (displayText, patch) => {
    const updated = { ...detailsRef.current, ...patch };
    setDetails(updated);
    detailsRef.current = updated;
    pushUser(displayText);
    goToStep(stepIndex + 1, updated);
  };

  /* ----------------------------- input handlers ----------------------------- */
  const handleTextSubmit = () => {
    const err = currentStep.validate(textDraft, detailsRef.current);
    if (err) return setInputError(err);
    const value = currentStep.format ? currentStep.format(textDraft) : textDraft.trim();
    commitAnswer(value, { [currentStep.key]: value });
  };

  const handleGenderSelect = (value) => {
    setInputError("");
    commitAnswer(value, { identity: value });
  };

  const handleDateSubmit = () => {
    if (!dateDraft) return setInputError("Please select your date of birth");
    commitAnswer(formatDateDisplay(dateDraft), { birthDate: toYMD(dateDraft) });
  };

  const handleTimeSubmit = () => {
    if (detailsRef.current.unknownBirthTime) {
      commitAnswer("I don't know my exact birth time", { birthTime: "", unknownBirthTime: true });
      return;
    }
    if (!timeDraft) return setInputError("Please select your birth time or tick 'unknown'");
    const hh = String(timeDraft.getHours()).padStart(2, "0");
    const mm = String(timeDraft.getMinutes()).padStart(2, "0");
    const label = timeDraft.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    commitAnswer(label, { birthTime: `${hh}:${mm}`, unknownBirthTime: false });
  };

  const handlePlaceSubmit = () => {
    const err = currentStep.validate(detailsRef.current.birthPlace, detailsRef.current);
    if (err) return setInputError(err);
    commitAnswer(detailsRef.current.birthPlace, {});
  };

  const handleMobileSubmit = () => {
    const err = currentStep.validate(textDraft);
    if (err) return setInputError(err);
    commitAnswer(`+91 ${textDraft}`, { mobileNumber: textDraft });
  };

  /* ------------------------------- OTP + auth ------------------------------- */
  const beginOtp = async (finalDetails) => {
    try {
      const sent = await sendOtp(finalDetails.mobileNumber);
      if (sent) {
        setPhase("otp");
      } else {
        Toast.error("Failed to send OTP. Please try again.");
        resetToMobileEdit();
      }
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Failed to send OTP");
      resetToMobileEdit();
    }
  };

  const handleVerifyOtp = async (otp) => {
    const result = await verifyAndRegister(detailsRef.current, detailsRef.current.mobileNumber, otp);
    if (!result.ok) {
      Toast.error(result.message || "OTP verification failed");
      return false;
    }
    setPhase("connecting");
    pushBot(`You're all set! Connecting you with ${astroName}...`);
    setTimeout(() => initiateChat(), 300);
    return true;
  };

  const handleResendOtp = async () => {
    await resendOtp(detailsRef.current.mobileNumber);
    Toast.success("OTP resent successfully");
  };

  // Closing the OTP popup keeps all collected details, removes the entered
  // mobile-number bubble from the chat, and drops the number back into the
  // input field so the user can edit and resend (which reopens the OTP popup).
  const resetToMobileEdit = () => {
    sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
    const mobile = detailsRef.current.mobileNumber || "";
    setMessages((m) => m.filter((msg) => !(msg.isSender && msg.text === `+91 ${mobile}`)));
    setPhase("collecting");
    setStepIndex(STEPS.length - 1);
    setTextDraft(mobile);
    setInputError("");
  };

  /* --------------------------- chat initiation ----------------------------- */
  const initiateChat = (targetAstro) => {
    const astro = targetAstro || astrologerRef.current;
    const userId = localStorage.getItem("shubhtalk_customer_id");
    if (!astro?._id || !userId) {
      Toast.error("Something went wrong. Please try again.");
      return;
    }

    if (!voiceSocket.connected) {
      voiceSocket.io.opts.query = { userId, role: "CUSTOMER" };
      voiceSocket.connect();
    }

    sessionStorage.setItem(GUEST_AUTO_ACCEPT_KEY, astro._id);

    // Track the request in the global queue so the waiting popup is available
    // once the user leaves this screen. The sticky popup is suppressed while the
    // user is ON the guest chat route (HomeLayout hides it there); this screen
    // shows its own inline "Waiting..." status instead.
    addPendingConnection({
      id: `${astro._id}-chat-${Date.now()}`,
      astrologer: astro,
      type: "chat",
      roomId: null,
      waitingTime: 2,
    });

    setPhase("waiting");
    voiceSocket.emit("chat:initiate", {
      userId,
      astrologerId: astro._id,
      type: "chat",
      isLive: false,
    });
  };

  useEffect(() => {
    const handleChatRoom = (data) => {
      if (!data?.roomId) return;
      roomIdRef.current = data.roomId;
      const waiting = Number(data?.waitingTime) || 0;
      if (waiting > 0) {
        // Astrologer is busy — wait 30s before offering alternatives so they
        // have a chance to accept first (don't open the popup immediately).
        clearTimeout(matchTimerRef.current);
        matchTimerRef.current = setTimeout(() => setShowMatch(true), 30000);
      }
    };

    const handleAstrologerAccepted = (data) => {
      const { roomId } = data || {};
      clearTimeout(matchTimerRef.current);
      const flag = sessionStorage.getItem(GUEST_AUTO_ACCEPT_KEY);
      if (flag && roomId) {
        voiceSocket.emit("chat:user_accept", { roomId });
        sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
      }
    };

    const handleChatAccepted = ({ roomId, astrologerId: accAstroId, userId, ...data }) => {
      clearTimeout(matchTimerRef.current);
      setShowMatch(false);
      sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
      if (roomId) removePendingConnection(roomId);

      const astro = data?.astrologer || astrologerRef.current || {};
      const targetId = accAstroId || astro?._id;
      const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
      const fullName = `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim();

      setActiveChat({
        roomId,
        chatRoomId: roomId,
        callerName: fullName || "Astrologer",
        isUserSide: true,
        userId: userIdLocal,
        astrologerId: targetId,
        astrologerID: astro?.astrologer_ID,
        astrologerName: astro?.firstName || "",
        remainingTime: data?.remainingTime,
        isEmergency: data?.isEmergency || false,
        profileImgUrl: astro?.profileImgUrl,
        experience: astro?.experience,
      });
      setChatSeconds(Number(data?.remainingTime || 0) * 60);

      navigate(`/chat-to-astrologer/${targetId}`, {
        state: {
          userId: userIdLocal,
          astrologerId: targetId,
          fullName,
          roomId,
          isUserSide: true,
          astrologerName: astro?.firstName || "",
          astroID: astro?.astrologer_ID,
          experience: astro?.experience,
          profileImgUrl: astro?.profileImgUrl,
        },
      });
    };

    const handleRejected = () => {
      sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
      if (roomIdRef.current) removePendingConnection(roomIdRef.current);
      Toast.error("Astrologer is unavailable right now. Here are some options.");
      setShowMatch(true);
    };

    const handleError = (err) => {
      Toast.error(err?.message || "Connection error. Please pick another astrologer.");
      setShowMatch(true);
    };

    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("chat:astrologer_accepted", handleAstrologerAccepted);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("chat:rejected", handleRejected);
    voiceSocket.on("chat:on_hold", handleRejected);
    voiceSocket.on("error", handleError);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("chat:astrologer_accepted", handleAstrologerAccepted);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("chat:rejected", handleRejected);
      voiceSocket.off("chat:on_hold", handleRejected);
      voiceSocket.off("error", handleError);
      clearTimeout(matchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectMatch = (newAstro) => {
    if (!newAstro?._id) return;
    clearTimeout(matchTimerRef.current);
    if (roomIdRef.current) {
      voiceSocket.emit("chat:cancel", { roomId: roomIdRef.current });
      removePendingConnection(roomIdRef.current);
      roomIdRef.current = null;
    }
    astrologerRef.current = newAstro;
    setShowMatch(false);
    pushBot(`Connecting you with ${newAstro.firstName || "the astrologer"}...`);
    initiateChat(newAstro);
  };

  /* -------------------------------- render --------------------------------- */
  const renderControl = () => {
    if (phase !== "collecting") {
      return (
        <div className={styles.statusBar}>
          <span className={styles.spinner} />
          <span>
            {phase === "otp"
              ? "Verify the OTP to continue..."
              : phase === "connecting"
              ? "Setting up your account..."
              : `Waiting for ${astroName} to accept...`}
          </span>
        </div>
      );
    }

    if (!currentStep) {
      return (
        <div className={styles.statusBar}>
          <span className={styles.spinner} />
          <span>Sending verification code...</span>
        </div>
      );
    }

    switch (currentStep.type) {
      case "gender":
        return (
          <div className={styles.chipRow}>
            {["Male", "Female", "Others"].map((g) => (
              <button key={g} className={styles.chip} onClick={() => handleGenderSelect(g)}>
                {g}
              </button>
            ))}
          </div>
        );
      case "date":
        return (
          <div className={styles.controlRow}>
            <DateTimePicker
              mode="date"
              dropUp
              openOnClick
              selected={dateDraft}
              onChange={(d) => {
                setDateDraft(d);
                setInputError("");
              }}
              maxDate={new Date()}
              placeholder="dd/mm/yyyy"
            />
            <SendButton onClick={handleDateSubmit} />
          </div>
        );
      case "time":
        return (
          <div className={styles.timeControl}>
            <div className={styles.controlRow}>
              <DateTimePicker
                mode="time"
                dropUp
                openOnClick
                selected={timeDraft}
                onChange={(d) => {
                  setTimeDraft(d);
                  setInputError("");
                }}
                disabled={details.unknownBirthTime}
                placeholder="HH:MM AM/PM"
              />
              <SendButton onClick={handleTimeSubmit} />
            </div>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={details.unknownBirthTime}
                onChange={(e) => setDetails((d) => ({ ...d, unknownBirthTime: e.target.checked }))}
              />
              I don't know my exact birth time
            </label>
          </div>
        );
      case "place":
        return (
          <div className={styles.controlRow}>
            <div className={styles.placeWrap}>
              <LocationSearch
                dropUp
                value={details.birthPlace}
                onChange={(e) => setDetails((d) => ({ ...d, birthPlace: e.target.value }))}
                onPlaceSelect={(place) => {
                  setDetails((d) => ({
                    ...d,
                    birthPlace: place.address,
                    latitude: place.lat,
                    longitude: place.lng,
                    timezone: place.timezone ?? 5.5,
                  }));
                  setInputError("");
                }}
              />
            </div>
            <SendButton onClick={handlePlaceSubmit} />
          </div>
        );
      case "mobile":
        return (
          <div className={chat.inputWrapper}>
            <span className={styles.mobilePrefix}>+91</span>
            <textarea
              className={chat.inputField}
              rows={1}
              inputMode="numeric"
              placeholder={currentStep.placeholder}
              value={textDraft}
              onChange={(e) => {
                setTextDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 10));
                setInputError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleMobileSubmit();
                }
              }}
            />
            <div className={chat.inputIcons}>
              <SendButton onClick={handleMobileSubmit} />
            </div>
          </div>
        );
      default:
        return (
          <div className={chat.inputWrapper}>
            <textarea
              className={chat.inputField}
              rows={1}
              placeholder={currentStep.placeholder}
              value={textDraft}
              onChange={(e) => {
                setTextDraft(e.target.value);
                setInputError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSubmit();
                }
              }}
            />
            <div className={chat.inputIcons}>
              <SendButton onClick={handleTextSubmit} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={chat.chatPage}>
      <div className={chat.chatWindow}>
        {/* Header — mirrors the real ChatHeader (without the in-session footer) */}
        <div className={chat.header}>
          <div className={chat.headerLeft}>
            <IoArrowBack className={chat.backIcon} onClick={() => navigate(-1)} />
            <img
              src={imgError || !astrologer?.profileImgUrl ? getAstrologerDefaultImage(astrologer?.gender) : astroImg}
              className={chat.headerAvatar}
              alt={astroName}
              onError={() => setImgError(true)}
            />
            <div className={chat.userInfo}>
              <PrimaryText size_16 isSemiBold>
                {capitalizeWords(astroName)}
              </PrimaryText>
              {astrologer?.experience ? (
                <span className={chat.experienceText}>
                  Exp. {parseInt(astrologer.experience) || 0}{" "}
                  {parseInt(astrologer.experience) > 1 ? "years" : "year"}
                </span>
              ) : (
                <span className={chat.experienceText}>Answer a few questions to start</span>
              )}
            </div>
          </div>
        </div>

        <div className={chat.messagesContainer}>
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            messagesRef={messagesRef}
            astrologerName={astroName}
            customerName={details.name}
          />
        </div>

        {inputError && <p className={styles.errorText}>{inputError}</p>}
        <div className={chat.inputBox}>{renderControl()}</div>
      </div>

      <OtpModal
        isOpen={phase === "otp"}
        phoneNumber={"91" + details.mobileNumber}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onClose={resetToMobileEdit}
        isVerifying={verifying}
        closeOnOverlayClick={false}
      />

      <GuestMatchModal
        open={showMatch}
        onClose={() => setShowMatch(false)}
        currentAstrologerId={astrologerRef.current?._id}
        onSelect={handleSelectMatch}
      />
    </div>
  );
};

export default GuestChatFlow;
