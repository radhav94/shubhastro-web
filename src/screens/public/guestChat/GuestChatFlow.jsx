import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import {
  IoArrowBack,
  IoPersonOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoSparkles,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { FaMars, FaVenus, FaTransgenderAlt } from "react-icons/fa";
import DateTimePicker from "../../../component/UI/dateTimePicker/DateTimePicker";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import OtpModal from "../../../component/UI/Profile/OtpModal";
import { PrimaryText, Toast } from "../../../component";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { useChat } from "../../../context/ChatContext";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";
import { getAstrologerDefaultImage, getAstrologerImageUrl } from "../../../utils/appImages";
import { getToken } from "../../../utils/token";
import { capitalizeWords } from "../../../utils/capitalize";
import {
  getAstrologerDisplayName,
  getAstrologerProfilePath,
} from "../../../utils/helper/string.utils";
import { useGetBalanceMutation } from "../../../redux/api/wallet/walletApi";
import RechargeModal from "../../../component/recharge-modal/RechargeModal";
import {
  GUEST_AUTO_ACCEPT_KEY,
  GUEST_FANOUT_RESOLVED_KEY,
  loadGuestDraft,
  saveGuestDraft,
  clearGuestDraft,
} from "./guestChatConstants";
import { useGuestChatAuth } from "./useGuestChatAuth";
import { trackEvent } from "../../../utils/analytics";
import { personNameRegex, PERSON_NAME_ERROR } from "../../../utils/regex";
import chat from "../../private/home/components/chats/ChatWindow.module.scss";
import styles from "./GuestChatFlow.module.scss";
import {
  getSignupBonusLabel,
  isSignupBonusEnabled,
} from "../../../utils/featureConfig";

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

// Visual top-to-bottom order of the form fields. Used to decide which error to
// scroll to and announce when submit is blocked.
const FIELD_ORDER = ["name", "mobileNumber", "identity", "dob", "time", "birthPlace"];

// Extra balance checks before accepting that a just-registered guest is unfunded.
const BALANCE_RECHECK_ATTEMPTS = 2;
const BALANCE_RECHECK_DELAY_MS = 1200;

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
  const { addPendingConnection, removePendingConnection, cancelAll } = useWaitingQueue();
  const { sendOtp, resendOtp, verifyAndRegister, sendingOtp, verifying } = useGuestChatAuth();
  const [getBalance] = useGetBalanceMutation();
  const welcomeHandledRef = useRef(false);

  const astroFromState = location.state?.astrologer || null;
  const { data: astroApi } = useGetAstrologerByIdQuery(
    { id: astrologerId },
    { skip: !astrologerId || !!astroFromState }
  );
  const astrologer = astroFromState || astroApi?.data || null;
  const astrologerRef = useRef(astrologer);
  astrologerRef.current = astrologer;

  const astroName = getAstrologerDisplayName(astrologer) || "Astrologer";
  // `small` (100x125): the guest-chat header and message avatars render at
  // roughly 28-40px, so the smallest derivative is the right one.
  const astroImg = getAstrologerImageUrl(astrologer, "small");
  const [imgError, setImgError] = useState(false);

  const [phase, setPhase] = useState("collecting"); // collecting | otp | connecting | waiting
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, ...(loadGuestDraft() || {}) }));
  const [errors, setErrors] = useState({});
  // Persistent failure message shown directly under the submit button. A toast
  // alone renders top-right and is easy to miss on a phone while the user is
  // looking at the button they just tapped, which leads to repeat taps.
  const [submitError, setSubmitError] = useState("");

  const [confirmLeave, setConfirmLeave] = useState(false);
  const leaveActionRef = useRef(null); // fn to run when the user confirms leaving
  const confirmSourceRef = useRef(null); // "back" | "popstate"
  const roomIdRef = useRef(null);
  const messagesRef = useRef(null);
  // Similar online astrologers returned by preSessionBalanceCheck. Used to fan
  // out the chat request (first-accept-wins) so a guest connects quickly.
  const similarAstrosRef = useRef([]);
  // Holds the hook-shaped details (name/identity/birthDate(YYYY-MM-DD)/...) once
  // the form is submitted, for OTP verify / register / resend.
  const detailsRef = useRef(null);

  // Field wrappers, keyed by field name, so a blocked submit can scroll the
  // first invalid field into view instead of failing silently off-screen.
  const fieldRefs = useRef({});
  // Bumped to ask LocationSearchVedic to put its suggestion list back on screen.
  const [placeReopenSignal, setPlaceReopenSignal] = useState(0);

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
      navigate(
        astrologerId
          ? getAstrologerProfilePath(
              astrologer || astrologerRef.current || astrologerId,
              astrologerId
            )
          : "/astrologers",
        { replace: true }
      );
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

  const isTyping = ["welcome", "connecting", "recharge", "waiting"].includes(phase);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  // Guest chat only: after registration a welcome popup appears (bonus for new
  // users, welcome-back for existing). Once it's closed, check the balance:
  //  - low balance  → show the recharge popup
  //  - enough       → initiate the chat and show the waiting popup
  useEffect(() => {
    // New user (welcome-bonus): check balance → recharge or initiate chat.
    const onBonusClosed = () => {
      if (welcomeHandledRef.current) return;
      welcomeHandledRef.current = true;
      handleWelcomeClosed();
    };
    // Existing user (welcome-back): if balance is low send them to the recharge
    // page; otherwise initiate the chat request and go to the astrologers page.
    const onBackClosed = async () => {
      if (welcomeHandledRef.current) return;
      welcomeHandledRef.current = true;
      const astro = astrologerRef.current;
      if (astro?._id) {
        try {
          const result = await getBalance({ astrologerId: astro._id });
          if (result?.data?.data?.status === false) {
            navigate("/recharge", { replace: true });
            return;
          }
          similarAstrosRef.current = result?.data?.data?.similarOnlineAstrologers || [];
        } catch (err) {
          console.error("Guest balance check failed:", err);
        }
      }
      // Stay on the guest-chat screen and ring here (phase = "waiting"); the
      // sticky waiting/ringing card shows over it and this screen's own
      // chat:accepted / chat:rejected handlers open the chat or recover. It used
      // to navigate to /astrologers, which unmounted those handlers and dropped
      // the guest on the listing with the generic waiting popup.
      initiateChat();
    };
    window.addEventListener("welcome-bonus-closed", onBonusClosed);
    window.addEventListener("welcome-back-closed", onBackClosed);
    return () => {
      window.removeEventListener("welcome-bonus-closed", onBonusClosed);
      window.removeEventListener("welcome-back-closed", onBackClosed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------- form logic ------------------------------- */
  // Keep the draft in step with the form so a detour or a back gesture doesn't
  // cost the user everything they typed.
  useEffect(() => {
    saveGuestDraft(form);
  }, [form]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /*
    Keep the focused field (and the CTA below it) above the on-screen keyboard.

    This screen borrows ChatWindow's `.chatPage`, which is
    `position: fixed; top: 53px; bottom: 0; overflow: hidden` — the document
    cannot scroll, and the only scroller is `.body`. A fixed box is laid out
    against the layout viewport, not the visual one, so when the keyboard opens
    the bottom of it is simply covered: the last fields and the
    "Continue & Get ₹250 Bonus" button end up behind the keyboard with no way to
    scroll to them, because the browser's own "scroll the focused input into
    view" behaviour has nothing to scroll. Worse in an in-app browser like
    Facebook's, which takes another slice of viewport for its own chrome.

    A visitor who cannot see the button they are trying to press taps where they
    think it is — that is a dead click, and it repeats. This session spent nearly
    six minutes on this form.

    So: scroll the focused control into view inside `.body` ourselves, once the
    keyboard has finished animating, and again whenever the visual viewport
    resizes while a field is focused.
  */
  const focusScrollTimerRef = useRef(null);

  const scrollActiveFieldIntoView = () => {
    const el = document.activeElement;
    const scroller = messagesRef.current;
    if (!el || !scroller?.contains(el)) return;
    if (!/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName)) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  // React's onFocus uses focusin, so one handler on the scroller covers every
  // field inside the form bubble, including ones added later.
  const handleFieldFocus = () => {
    clearTimeout(focusScrollTimerRef.current);
    // The keyboard animates in over ~250-300ms; scrolling before the visual
    // viewport has settled lands in the wrong place.
    focusScrollTimerRef.current = setTimeout(scrollActiveFieldIntoView, 300);
  };

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const onResize = () => scrollActiveFieldIntoView();
    vv.addEventListener("resize", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      clearTimeout(focusScrollTimerRef.current);
    };
  }, []);

  // Open the DateTimePicker's calendar by triggering its (hidden) internal
  // button, so the left calendar icon opens the picker while typing stays enabled.
  //
  // Every failure path here used to be silent: the icon looks tappable but the
  // tap produces nothing if the inner button is missing (markup changed) or
  // `disabled` — which is exactly the case for Birth Time once "don't know the
  // exact time" is ticked, since DateTimePicker forwards `disabled` to it.
  const openPickerFromIcon = (e) => {
    const inner = e.currentTarget.parentElement?.querySelector('button[tabindex="-1"]');

    if (!inner) {
      Toast.error("Couldn't open the picker. Please type the value instead.");
      return;
    }
    if (inner.disabled) {
      Toast.info("Birth time is marked as unknown — untick that to pick a time.");
      return;
    }
    inner.click();
  };

  // One rule per field so the same logic can run on blur (immediate, next to the
  // field) and on submit. Previously validation existed only as a single
  // submit-time pass, so a guest filled six fields, tapped the CTA and only then
  // discovered the problem — usually a birth place typed but never picked from
  // the suggestions, which is invisible until you try to continue.
  const validateField = (key, f = form) => {
    switch (key) {
      case "name":
        if (!f.name.trim()) return "Please enter your name";
        if (!personNameRegex.test(f.name.trim()))
          return PERSON_NAME_ERROR;
        return undefined;
      case "mobileNumber":
        if (!/^[6-9]\d{9}$/.test(f.mobileNumber || ""))
          return "Enter a valid 10-digit mobile number";
        return undefined;
      case "identity":
        return f.identity ? undefined : "Please select your gender";
      case "dob":
        return f.dob ? undefined : "Please select your date of birth";
      case "time":
        if (f.unknownBirthTime) return undefined;
        return f.time ? undefined : "Please select your birth time";
      case "birthPlace":
        if (!f.birthPlace.trim()) return "Please select your place of birth";
        if (!f.latitude || !f.longitude)
          return "Tap a city from the suggestions so we can use the right timezone";
        return undefined;
      default:
        return undefined;
    }
  };

  const validate = (f = form) => {
    const e = {};
    FIELD_ORDER.forEach((key) => {
      const message = validateField(key, f);
      if (message) e[key] = message;
    });
    return e;
  };

  // Surface a problem the moment the user leaves the field.
  const handleBlur = (key) => {
    const message = validateField(key);
    setErrors((e) => ({ ...e, [key]: message }));
  };

  const handleSubmit = async () => {
    if (sendingOtp) {
      Toast.error("Sending your OTP — one moment.");
      return;
    }

    setSubmitError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      // The form is taller than a phone viewport, so the invalid field is
      // usually off-screen — most often "pick a location from the dropdown"
      // after the user typed a place without selecting a suggestion. Inline
      // <span> errors alone make the button look broken and invite rage taps.
      // Bring the first problem into view, focus it, and say it out loud once.
      const firstInvalid = FIELD_ORDER.find((key) => e[key]);
      const node = firstInvalid && fieldRefs.current[firstInvalid];
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        node.querySelector("input, button")?.focus({ preventScroll: true });
      }
      if (firstInvalid) Toast.error(e[firstInvalid]);

      /*
        "Tap a city from the suggestions" needs the suggestions to be on screen.
        focus() above cannot do it: LocationSearchVedic re-opens from its own
        `onFocus`, and focus() fires no event on an already-focused element —
        the normal state right after typing on a phone. Same wiring as
        GuestDetailsForm; see the longer note there (Clarity wxnjlw).
      */
      if (firstInvalid === "birthPlace" && form.birthPlace.trim()) {
        setPlaceReopenSignal((n) => n + 1);
      }

      // Recorded so it's possible to tell, from analytics alone, whether repeat
      // taps on this button are validation or a failing OTP send — and which
      // field trips people up. Session recordings can't distinguish the two.
      trackEvent("guest_chat_signup_blocked", {
        blocker: "validation",
        field: firstInvalid,
        error_reason: firstInvalid ? e[firstInvalid] : "unknown",
        invalid_field_count: Object.keys(e).length,
      });
      return;
    }

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
    await beginOtp(details);
  };

  /* ------------------------------- OTP + auth ------------------------------- */
  const beginOtp = async (finalDetails) => {
    const fail = (message, errorReason) => {
      Toast.error(message);
      setSubmitError(message);
      setPhase("collecting");
      trackEvent("guest_chat_signup_blocked", {
        blocker: "otp_send_failed",
        error_reason: errorReason || message,
      });
    };

    try {
      const sent = await sendOtp(finalDetails.mobileNumber);
      if (sent) {
        setSubmitError("");
        setPhase("otp");
        trackEvent("otp_sent", { delivery_status: "success", source: "guest_chat" });
      } else {
        fail("Failed to send OTP. Please try again.", "non_2xx_response");
      }
    } catch (error) {
      fail(
        error?.response?.data?.message || "Failed to send OTP. Please try again.",
        error?.response?.status
          ? `http_${error.response.status}`
          : error?.message || "request_threw"
      );
    }
  };

  const handleVerifyOtp = async (otp) => {
    const result = await verifyAndRegister(detailsRef.current, detailsRef.current.mobileNumber, otp);
    if (!result.ok) {
      Toast.error(result.message || "OTP verification failed");
      return false;
    }
    // NOTE: the draft is deliberately NOT cleared here. OTP success is not the
    // end of the road — if the profile/kundli can't be resolved, the app hard
    // redirects to /login?step=personalize, and the draft is what prefills those
    // onboarding screens instead of asking for the same six answers again. It is
    // cleared once the chat actually starts.

    // The welcome popup (bonus/back) is now shown; the balance check + chat
    // initiation happen once it's closed (see the welcome-closed listener).
    welcomeHandledRef.current = false;
    setPhase("welcome");
    pushBot("You're all set!");
    // Safety: the welcome popup auto-closes ~5s and fires a close event; if that
    // event is somehow missed, proceed anyway after a short grace period.
    setTimeout(() => {
      if (!welcomeHandledRef.current) {
        welcomeHandledRef.current = true;
        handleWelcomeClosed();
      }
    }, 7000);
    return true;
  };

  // After the welcome popup closes: check balance → recharge or initiate chat.
  const handleWelcomeClosed = async () => {
    const astro = astrologerRef.current;
    if (!astro?._id) {
      navigate("/astrologers", { replace: true });
      return;
    }
    try {
      // The welcome bonus is credited server-side during registration, and this
      // check runs seconds later. If the credit lands even slightly after it, a
      // funded guest gets a recharge wall immediately after being told ₹250 was
      // added to their wallet — and that ends the visit. Re-check a couple of
      // times before believing a zero balance. Costs a short pause only in the
      // genuinely-unfunded case, and rescues the race.
      let result = await getBalance({ astrologerId: astro._id });

      for (
        let attempt = 0;
        attempt < BALANCE_RECHECK_ATTEMPTS && result?.data?.data?.status === false;
        attempt += 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, BALANCE_RECHECK_DELAY_MS));
        result = await getBalance({ astrologerId: astro._id });
      }

      if (result?.data?.data?.status === false) {
        trackEvent("guest_chat_signup_blocked", {
          blocker: "insufficient_balance_after_signup",
          error_reason: "balance_check_false_after_retries",
        });
        setPhase("recharge");
        return;
      }
      similarAstrosRef.current = result?.data?.data?.similarOnlineAstrologers || [];
    } catch (err) {
      console.error("Guest balance check failed:", err);
    }
    // Balance OK: initiate the chat request and ring in place. This is the real
    // end of the funnel, so the draft can go now. The guest stays on this screen
    // (phase = "waiting") with the ringing card over it; chat:accepted opens the
    // chat. It used to navigate to /astrologers and hand off to the global queue.
    clearGuestDraft();
    initiateChat();
  };

  // Recharge completed → initiate the chat and ring in place on this screen.
  const handleRechargeSuccess = () => {
    initiateChat();
  };

  // Recharge popup dismissed without recharging → go to the astrologers page.
  const handleRechargeClose = () => {
    navigate("/astrologers", { replace: true });
  };

  /*
    Resend was silent on failure and could throw on a missing ref.

    There was no try/catch here, and OtpModal's ResendCountdown swallows the
    rejection ("parent surfaces the error") — so nothing surfaced it. If the
    resend request failed, tapping "Resend OTP" produced no toast, no error and no
    countdown: a dead click on the last step of the signup funnel, at the point
    where the visitor is already waiting on an SMS.

    The throw is deliberate: it keeps ResendCountdown from starting its 60s timer,
    so the button stays available to try again rather than locking out for a
    minute after a request that never went out.
  */
  const handleResendOtp = async () => {
    const mobileNumber = detailsRef.current?.mobileNumber || form.mobileNumber;
    if (!mobileNumber) {
      Toast.error("We don't have your number. Please go back and enter it again.");
      throw new Error("guest-chat: resend without a mobile number");
    }

    try {
      await resendOtp(mobileNumber);
      Toast.success("OTP resent successfully");
    } catch (err) {
      Toast.error("Couldn't resend the code. Please check your connection and try again.");
      throw err;
    }
  };

  // Closing the OTP popup returns to the form with all details intact so the
  // user can edit (e.g. the mobile number) and submit again.
  const handleOtpClose = () => {
    sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
    setPhase("collecting");
  };

  /* --------------------------- chat initiation ----------------------------- */
  // Fan out the chat request to the selected astrologer AND the similar online
  // astrologers from preSessionBalanceCheck (first-accept-wins). The global
  // WaitingQueueContext auto-accepts the first acceptance and withdraws the rest.
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

    // Fresh fan-out: mark for auto-accept and clear any stale "resolved" marker.
    sessionStorage.setItem(GUEST_AUTO_ACCEPT_KEY, astro._id);
    sessionStorage.removeItem(GUEST_FANOUT_RESOLVED_KEY);

    // Selected astrologer + chat-capable similar online astrologers (deduped).
    const similar = (similarAstrosRef.current || []).filter(
      (a) => a?._id && a._id !== astro._id && (a.isActiveType || []).includes("chat")
    );
    const targets = [astro, ...similar];

    setPhase("waiting");
    targets.forEach((t, i) => {
      addPendingConnection({
        id: `${t._id}-chat-${Date.now()}-${i}`,
        astrologer: t,
        type: "chat",
        roomId: null,
        waitingTime: 2,
      });
      voiceSocket.emit("chat:initiate", {
        userId,
        astrologerId: t._id,
        type: "chat",
        isLive: false,
      });
    });
  };

  // True while a chat request is live (waiting for the astrologer).
  const isRequestPending = phase === "connecting" || phase === "waiting";

  // Cancel the in-flight chat request(s) and clean up. With fan-out there can be
  // several pending requests, so withdraw them all.
  const cancelChatRequest = () => {
    sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
    sessionStorage.removeItem(GUEST_FANOUT_RESOLVED_KEY);
    cancelAll();
    roomIdRef.current = null;
  };

  /*
   * `navigate(-1)` only has somewhere to go if this app put an entry in the
   * history stack. React Router stamps the first entry of a session with
   * key "default", so that is the reliable test — `window.history.length` is
   * not, because it counts cross-origin entries, and paid traffic arrives
   * through a redirect chain (facebook.com -> l.facebook.com -> here) that
   * makes the stack look deep while stepping back lands on an ad redirector.
   * Guests reach this screen straight from a Chat tap, so the listing is the
   * right fallback.
   */
  const goBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/astrologers", { replace: true });
    }
  };

  // In-app back button: confirm (via modal) before leaving while a request is pending.
  const handleBack = () => {
    if (isRequestPending) {
      confirmSourceRef.current = "back";
      leaveActionRef.current = () => {
        cancelChatRequest();
        goBack();
      };
      setConfirmLeave(true);
      return;
    }
    goBack();
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
      const fullName = getAstrologerDisplayName(astro);

      setActiveChat({
        roomId,
        chatRoomId: roomId,
        callerName: fullName || "Astrologer",
        isUserSide: true,
        userId: userIdLocal,
        astrologerId: targetId,
        astrologerID: astro?.astrologer_ID,
        astrologerName: getAstrologerDisplayName(astro),
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
          astrologerName: getAstrologerDisplayName(astro),
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
      navigate(
        astrologerId
          ? getAstrologerProfilePath(
              astrologerRef.current || astrologerId,
              astrologerId
            )
          : "/astrologers",
        { replace: true }
      );
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
        navigate(
          astrologerId
            ? getAstrologerProfilePath(
                astrologerRef.current || astrologerId,
                astrologerId
              )
            : "/astrologers",
          { replace: true }
        );
      };
      setConfirmLeave(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRequestPending]);

  /* -------------------------------- render --------------------------------- */
  const GENDERS = [
    { value: "Male", label: "Male", Icon: FaMars },
    { value: "Female", label: "Female", Icon: FaVenus },
    { value: "Others", label: "Others", Icon: FaTransgenderAlt },
  ];

  // Details form rendered inside a bot message bubble.
  const renderFormBubble = () => (
    <div className={styles.formCard}>
      {/* Name */}
      <div className={styles.field} ref={(el) => (fieldRefs.current.name = el)}>
        <label className={styles.label}>
          Name <span className={styles.req}>*</span>
        </label>
        <div className={styles.iconField}>
          <IoPersonOutline className={styles.leftIcon} />
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="Enter your name"
            autoComplete="name"
          />
        </div>
        {errors.name && <span className={styles.err}>{errors.name}</span>}
      </div>

      {/* Mobile number */}
      <div className={styles.field} ref={(el) => (fieldRefs.current.mobileNumber = el)}>
        <label className={styles.label}>
          Mobile Number <span className={styles.req}>*</span>
        </label>
        <div className={styles.mobileWrap}>
          {/*
            Fixed +91 — validation is Indian-format only and the backend prefixes
            "91". A chevron here promised a country picker that does not exist,
            which non-Indian users tapped repeatedly. Explain on tap instead.
          */}
          <button
            type="button"
            className={styles.flagBox}
            onClick={() => Toast.info("We currently support Indian (+91) mobile numbers only.")}
            title="Indian (+91) numbers only"
          >
            <span className={styles.flag}>🇮🇳</span>
            +91
          </button>
          <input
            className={styles.input}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.mobileNumber}
            onChange={(e) => setField("mobileNumber", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
            onBlur={() => handleBlur("mobileNumber")}
            placeholder="Enter mobile number"
            autoComplete="tel-national"
          />
        </div>
        {errors.mobileNumber && <span className={styles.err}>{errors.mobileNumber}</span>}
      </div>

      {/* Identity */}
      <div className={styles.field} ref={(el) => (fieldRefs.current.identity = el)}>
        <label className={styles.label}>
          Identity <span className={styles.req}>*</span>
        </label>
        <div className={styles.genderRow}>
          {GENDERS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              className={`${styles.genderCard} ${form.identity === value ? styles.genderActive : ""}`}
              onClick={() => setField("identity", value)}
            >
              <Icon className={styles.genderIcon} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        {errors.identity && <span className={styles.err}>{errors.identity}</span>}
      </div>

      {/* Birth date + time on one row */}
      <div className={styles.row2}>
        <div className={styles.field} ref={(el) => (fieldRefs.current.dob = el)}>
          <label className={styles.label}>
            Birth Date <span className={styles.req}>*</span>
          </label>
          <div className={styles.iconField}>
            <button type="button" className={styles.leftIconBtn} onClick={openPickerFromIcon} aria-label="Open calendar">
              <IoCalendarOutline />
            </button>
            <DateTimePicker
              mode="date"
              portal
              selected={form.dob}
              onChange={(d) => setField("dob", d)}
              maxDate={new Date()}
              placeholder="DD/MM/YYYY"
            />
          </div>
          {errors.dob && <span className={styles.err}>{errors.dob}</span>}
        </div>

        <div className={styles.field} ref={(el) => (fieldRefs.current.time = el)}>
          <label className={styles.label}>
            Birth Time <span className={styles.req}>*</span>
          </label>
          <div className={styles.iconField}>
            <button type="button" className={styles.leftIconBtn} onClick={openPickerFromIcon} aria-label="Open time picker">
              <IoTimeOutline />
            </button>
            <DateTimePicker
              mode="time"
              disabled={form.unknownBirthTime}
              disabledReason="Uncheck “Don’t know the exact time of birth” to pick a time"
              selected={form.time}
              onChange={(d) => setField("time", d)}
              placeholder="HH:MM AM/PM"
            />
          </div>
          {errors.time && <span className={styles.err}>{errors.time}</span>}
        </div>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={form.unknownBirthTime}
          onChange={(e) => setField("unknownBirthTime", e.target.checked)}
        />
        Don't know the exact time of birth
      </label>

      {/* Place of birth */}
      <div className={styles.field} ref={(el) => (fieldRefs.current.birthPlace = el)}>
        <label className={styles.label}>
          Place of Birth <span className={styles.req}>*</span>
        </label>
        <div className={styles.iconField}>
          <IoLocationOutline className={styles.leftIcon} />
          <LocationSearch
            value={form.birthPlace}
            reopenSignal={placeReopenSignal}
            onChange={(e) => setField("birthPlace", e.target.value)}
            onPlaceSelect={(place) => {
              setForm((f) => ({
                ...f,
                birthPlace: place.address,
                latitude: place.lat,
                longitude: place.lng,
                timezone: place.timezone ?? 5.5,
              }));
              setErrors((e) => ({ ...e, birthPlace: undefined }));
            }}
          />
        </div>
        {errors.birthPlace ? (
          <span className={styles.err}>{errors.birthPlace}</span>
        ) : (
          // Stated up front, because typing a city without choosing a suggestion
          // leaves no coordinates and is the most common reason this form blocks.
          <span className={styles.hint}>
            {form.latitude && form.longitude
              ? "Location confirmed"
              : "Start typing, then tap your city from the list"}
          </span>
        )}
      </div>

      {/*
        aria-disabled rather than `disabled`: a disabled button fires no click,
        so tapping during the OTP send produced no acknowledgement. handleSubmit
        refuses the duplicate and says why.
      */}
      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleSubmit}
        aria-disabled={sendingOtp}
        aria-busy={sendingOtp}
      >
        <IoSparkles size={18} />
        {sendingOtp
          ? "Sending OTP..."
          : isSignupBonusEnabled()
          ? `Continue & Get ${getSignupBonusLabel()} Bonus`
          : "Continue"}
      </button>

      {submitError && (
        <span className={styles.submitErr} role="alert">
          {submitError}
        </span>
      )}

      <div className={styles.secureRow}>
        <IoShieldCheckmarkOutline size={14} />
        100% Secure&nbsp;&nbsp;|&nbsp;&nbsp;Your data is safe with us
      </div>
    </div>
  );

  return (
    <div className={chat.chatPage}>
      <div className={chat.chatWindow}>
        {/* Header — mirrors the real ChatHeader (without the in-session footer) */}
        <div className={chat.header}>
          <div className={chat.headerLeft}>
            {/*
              A real <button>. This was an <svg> carrying the onClick: it is
              styled as a 40px circle so it reads as a button, but it was
              unreachable by keyboard, unannounced to screen readers, and taps on
              non-interactive elements are the least reliable kind on iOS Safari.
            */}
            <button
              type="button"
              className={chat.backIcon}
              onClick={handleBack}
              aria-label="Go back"
            >
              <IoArrowBack aria-hidden="true" />
            </button>
            {/*
              The avatar and name are now a link to the astrologer's profile.

              They were a bare <img> plus a <div> with no handler: a 48px circular
              photo next to a name and "Exp. N years", which is the single most
              tapped non-button element in any chat UI — people tap the person they
              are talking to. Here it did nothing, on a screen where the visitor
              has just picked this astrologer from a list and is being asked for
              six personal details before anything happens.

              Safe to navigate away from: the form is written to sessionStorage on
              every change (see the saveGuestDraft effect) and `loadGuestDraft()`
              seeds the state on mount, so coming back restores everything typed
              so far. During `collecting` there is no pending request either, so
              this does not need the leave-confirm that the back button uses.
            */}
            <Link
              to={getAstrologerProfilePath(astrologer || astrologerId, astrologerId)}
              className={styles.headerIdentityLink}
              aria-label={`View ${capitalizeWords(astroName)}'s profile`}
            >
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
            </Link>
          </div>
        </div>

        {/* onFocus (focusin) delegation keeps whichever field the keyboard is
            covering scrolled into view — see handleFieldFocus. */}
        <div className={styles.body} ref={messagesRef} onFocus={handleFieldFocus}>
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

          {/* Details form shown as a bot message bubble (stays visible behind the OTP popup) */}
          {(phase === "collecting" || phase === "otp") && (
            <div className={`${styles.msgRow} ${styles.botRow} ${styles.formRow}`}>
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

      <RechargeModal
        isOpen={phase === "recharge"}
        onClose={handleRechargeClose}
        onSuccess={handleRechargeSuccess}
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
