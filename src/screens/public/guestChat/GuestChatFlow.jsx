import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import DateTimePicker from "../../../component/UI/dateTimePicker/DateTimePicker";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import OtpModal from "../../../component/UI/Profile/OtpModal";
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
import chat from "../../private/home/components/chats/ChatWindow.module.scss";
import styles from "./GuestChatFlow.module.scss";

const INITIAL_FORM = {
  name: "",
  identity: "",
  dob: null, // Date
  time: null, // Date
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

const pad = (n) => String(n).padStart(2, "0");

const GuestChatFlow = () => {
  const { astrologerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { setActiveChat, setChatSeconds } = useChat();
  const { addPendingConnection, removePendingConnection } = useWaitingQueue();
  const { sendOtp, resendOtp, verifyAndRegister, sendingOtp, verifying } = useGuestChatAuth();

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
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const [confirmLeave, setConfirmLeave] = useState(false);
  const leaveActionRef = useRef(null); // fn to run when the user confirms leaving
  const confirmSourceRef = useRef(null); // "back" | "popstate"
  const roomIdRef = useRef(null);
  const messagesRef = useRef(null);
  // Holds the hook-shaped details (name/identity/birthDate(YYYY-MM-DD)/...) once
  // the form is submitted, for OTP verify / register / resend.
  const detailsRef = useRef(null);

  const pushMessage = (text, isSender, extra = {}) =>
    setMessages((m) => [
      ...m,
      {
        id: `${isSender ? "u" : "b"}-${Date.now()}-${Math.random()}`,
        text,
        isSender,
        time: nowTime(),
        ...extra,
      },
    ]);
  const pushBot = (text) => pushMessage(text, false);
  const pushUser = (text) => pushMessage(text, true);

  // A logged-in user must never stay in the guest flow (e.g. after refreshing
  // once registered mid-flow). Send them out and replace history.
  useEffect(() => {
    if (getToken()) {
      navigate(astrologerId ? `/astrologer/${astrologerId}` : "/astrologers", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed a single greeting message on mount.
  useEffect(() => {
    if (messages.length === 0) {
      pushBot(
        `Hi! Share a few details below and I'll connect you with ${astroName} for your consultation.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [astroName]);

  const isTyping = phase === "connecting" || phase === "waiting";

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  /* ------------------------------- form logic ------------------------------- */
  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    else if (!/^[A-Za-z\s]+$/.test(form.name.trim()))
      e.name = "Name can only contain letters and spaces";
    if (!form.identity) e.identity = "Please select your gender";
    if (!form.dob) e.dob = "Please select your date of birth";
    if (!form.unknownBirthTime && !form.time) e.time = "Please select your birth time";
    if (!form.birthPlace.trim()) e.birthPlace = "Please select your place of birth";
    else if (!form.latitude || !form.longitude) e.birthPlace = "Please pick a location from the dropdown";
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber || "")) e.mobileNumber = "Enter a valid 10-digit mobile number";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const details = {
      name: form.name.trim(),
      identity: form.identity,
      birthDate: toYMD(form.dob),
      birthTime: form.unknownBirthTime ? "" : `${pad(form.time.getHours())}:${pad(form.time.getMinutes())}`,
      unknownBirthTime: form.unknownBirthTime,
      birthPlace: form.birthPlace,
      latitude: form.latitude,
      longitude: form.longitude,
      timezone: form.timezone,
      mobileNumber: form.mobileNumber,
    };
    detailsRef.current = details;

    // Replace any previous details summary so re-submitting (e.g. after closing
    // the OTP popup) updates the same message instead of stacking duplicates.
    const summary = `${details.name}, ${form.identity}, born ${formatDob(form.dob)}${
      details.birthPlace ? ` in ${details.birthPlace}` : ""
    }`;
    setMessages((m) => [
      ...m.filter((msg) => !msg.isSummary),
      {
        id: `u-summary-${Date.now()}`,
        text: summary,
        isSender: true,
        time: nowTime(),
        isSummary: true,
      },
    ]);

    await beginOtp(details);
  };

  const formatDob = (d) =>
    d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : "";

  /* ------------------------------- OTP + auth ------------------------------- */
  const beginOtp = async (finalDetails) => {
    try {
      const sent = await sendOtp(finalDetails.mobileNumber);
      if (sent) {
        setPhase("otp");
      } else {
        Toast.error("Failed to send OTP. Please try again.");
        setPhase("collecting");
      }
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Failed to send OTP");
      setPhase("collecting");
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

  // Closing the OTP popup returns to the form with all details intact so the
  // user can edit (e.g. the mobile number) and submit again.
  const handleOtpClose = () => {
    sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
    setPhase("collecting");
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

    addPendingConnection({
      id: `${astro._id}-chat-${Date.now()}`,
      astrologer: astro,
      type: "chat",
      roomId: null,
      waitingTime: 2,
    });

    setPhase("waiting");
    pushBot(`Waiting for ${astro.firstName || astroName} to connect...`);
    voiceSocket.emit("chat:initiate", {
      userId,
      astrologerId: astro._id,
      type: "chat",
      isLive: false,
    });
  };

  // True while a chat request is live (waiting for the astrologer).
  const isRequestPending = phase === "connecting" || phase === "waiting";

  // Cancel the in-flight chat request and clean up.
  const cancelChatRequest = () => {
    sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
    if (roomIdRef.current) {
      voiceSocket.emit("chat:cancel", { roomId: roomIdRef.current });
      removePendingConnection(roomIdRef.current);
      roomIdRef.current = null;
    }
  };

  // In-app back button: confirm (via modal) before leaving while a request is pending.
  const handleBack = () => {
    if (isRequestPending) {
      confirmSourceRef.current = "back";
      leaveActionRef.current = () => {
        cancelChatRequest();
        navigate(-1);
      };
      setConfirmLeave(true);
      return;
    }
    navigate(-1);
  };

  const handleConfirmLeave = () => {
    setConfirmLeave(false);
    const action = leaveActionRef.current;
    leaveActionRef.current = null;
    confirmSourceRef.current = null;
    action?.();
  };

  const handleDismissLeave = () => {
    setConfirmLeave(false);
    // If the browser Back triggered this, re-arm the history guard so the next
    // Back press is intercepted again.
    if (confirmSourceRef.current === "popstate") {
      window.history.pushState({ guestChatGuard: true }, "");
    }
    confirmSourceRef.current = null;
    leaveActionRef.current = null;
  };

  useEffect(() => {
    const handleChatRoom = (data) => {
      if (!data?.roomId) return;
      roomIdRef.current = data.roomId;
      // Astrologer busy / has a waiting time → just keep waiting (same as the
      // normal flow); no "match you" popup.
    };

    const handleAstrologerAccepted = (data) => {
      const { roomId } = data || {};
      const flag = sessionStorage.getItem(GUEST_AUTO_ACCEPT_KEY);
      if (flag && roomId) {
        voiceSocket.emit("chat:user_accept", { roomId });
        sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
      }
    };

    const handleChatAccepted = ({ roomId, astrologerId: accAstroId, userId, ...data }) => {
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
      Toast.error("Astrologer is currently unavailable. Please try again.");
      navigate(astrologerId ? `/astrologer/${astrologerId}` : "/astrologers", { replace: true });
    };

    const handleError = (err) => {
      Toast.error(err?.message || "Something went wrong. Please try again.");
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intercept the browser Back button while a chat request is pending: confirm,
  // and cancel the request if the user really wants to leave.
  useEffect(() => {
    if (!isRequestPending) return;

    // Arm a history entry so the first Back press fires popstate instead of leaving.
    window.history.pushState({ guestChatGuard: true }, "");

    const onPopState = () => {
      confirmSourceRef.current = "popstate";
      leaveActionRef.current = () => {
        cancelChatRequest();
        navigate(astrologerId ? `/astrologer/${astrologerId}` : "/astrologers", { replace: true });
      };
      setConfirmLeave(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRequestPending]);

  /* -------------------------------- render --------------------------------- */
  // Compact details form rendered inside a bot message bubble.
  const renderFormBubble = () => (
    <div className={styles.formCard}>
      <div className={styles.field}>
        <input
          className={styles.input}
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Full name *"
        />
        {errors.name && <span className={styles.err}>{errors.name}</span>}
      </div>

      <div className={styles.field}>
        <div className={styles.chipRow}>
          {["Male", "Female", "Others"].map((g) => (
            <button
              key={g}
              type="button"
              className={`${styles.chip} ${form.identity === g ? styles.chipActive : ""}`}
              onClick={() => setField("identity", g)}
            >
              {g}
            </button>
          ))}
        </div>
        {errors.identity && <span className={styles.err}>{errors.identity}</span>}
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <DateTimePicker
            mode="date"
            openOnClick
            selected={form.dob}
            onChange={(d) => setField("dob", d)}
            maxDate={new Date()}
            placeholder="Date of birth *"
          />
          {errors.dob && <span className={styles.err}>{errors.dob}</span>}
        </div>
        <div className={styles.field}>
          <DateTimePicker
            mode="time"
            openOnClick
            disabled={form.unknownBirthTime}
            selected={form.time}
            onChange={(d) => setField("time", d)}
            placeholder="Time of birth *"
          />
          {errors.time && <span className={styles.err}>{errors.time}</span>}
        </div>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={form.unknownBirthTime}
          onChange={(e) => setField("unknownBirthTime", e.target.checked)}
        />
        I don't know my exact birth time
      </label>

      <div className={styles.field}>
        <LocationSearch
          value={form.birthPlace}
          onChange={(e) => setField("birthPlace", e.target.value)}
          onPlaceSelect={(place) =>
            setForm((f) => ({
              ...f,
              birthPlace: place.address,
              latitude: place.lat,
              longitude: place.lng,
              timezone: place.timezone ?? 5.5,
            }))
          }
        />
        {errors.birthPlace && <span className={styles.err}>{errors.birthPlace}</span>}
      </div>

      <div className={styles.field}>
        <div className={styles.mobileWrap}>
          <span className={styles.prefix}>+91</span>
          <input
            className={styles.input}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.mobileNumber}
            onChange={(e) => setField("mobileNumber", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
            placeholder="Mobile number *"
          />
        </div>
        {errors.mobileNumber && <span className={styles.err}>{errors.mobileNumber}</span>}
      </div>

      <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={sendingOtp}>
        {sendingOtp ? "Sending OTP..." : "Continue"}
      </button>
    </div>
  );

  return (
    <div className={chat.chatPage}>
      <div className={chat.chatWindow}>
        {/* Header — mirrors the real ChatHeader (without the in-session footer) */}
        <div className={chat.header}>
          <div className={chat.headerLeft}>
            <IoArrowBack className={chat.backIcon} onClick={handleBack} />
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
                <span className={chat.experienceText}>Share your details to start chatting</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.body} ref={messagesRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`${styles.msgRow} ${m.isSender ? styles.userRow : styles.botRow}`}
            >
              {!m.isSender && (
                <img
                  src={imgError || !astrologer?.profileImgUrl ? getAstrologerDefaultImage(astrologer?.gender) : astroImg}
                  className={styles.msgAvatar}
                  alt=""
                  onError={() => setImgError(true)}
                />
              )}
              <div className={`${styles.bubble} ${m.isSender ? styles.userBubble : styles.botBubble}`}>
                <span>{m.text}</span>
                <span className={styles.msgTime}>{m.time}</span>
              </div>
            </div>
          ))}

          {/* Compact details form shown as a bot message bubble */}
          {phase === "collecting" && (
            <div className={`${styles.msgRow} ${styles.botRow}`}>
              <img
                src={imgError || !astrologer?.profileImgUrl ? getAstrologerDefaultImage(astrologer?.gender) : astroImg}
                className={styles.msgAvatar}
                alt=""
                onError={() => setImgError(true)}
              />
              <div className={`${styles.bubble} ${styles.botBubble} ${styles.formBubble}`}>
                {renderFormBubble()}
              </div>
            </div>
          )}

          {isTyping && (
            <div className={`${styles.msgRow} ${styles.botRow}`}>
              <img
                src={imgError || !astrologer?.profileImgUrl ? getAstrologerDefaultImage(astrologer?.gender) : astroImg}
                className={styles.msgAvatar}
                alt=""
              />
              <div className={`${styles.bubble} ${styles.botBubble} ${styles.typingBubble}`}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          )}
        </div>
      </div>

      <OtpModal
        isOpen={phase === "otp"}
        phoneNumber={"91" + (detailsRef.current?.mobileNumber || form.mobileNumber)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onClose={handleOtpClose}
        isVerifying={verifying}
        closeOnOverlayClick={false}
      />

      {confirmLeave &&
        createPortal(
          <div className={styles.confirmOverlay} onClick={handleDismissLeave}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.confirmTitle}>Cancel chat request?</h3>
              <p className={styles.confirmText}>
                Your chat request is in progress. Do you want to cancel it and go back?
              </p>
              <div className={styles.confirmActions}>
                <button className={styles.confirmStay} onClick={handleDismissLeave}>
                  Stay
                </button>
                <button className={styles.confirmGo} onClick={handleConfirmLeave}>
                  Cancel &amp; go back
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default GuestChatFlow;
