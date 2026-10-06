import { requestFCMToken, onForegroundMessage } from "./firebase";
import { toast } from "react-hot-toast";

const FCM_TOKEN_KEY = "shubhtalk_fcm_token";

/**
 * Initializes FCM: requests permission, gets token, sets up foreground listener.
 * Call this once after user login or on app mount.
 */
export const initializeFCM = async () => {
  // Check browser support
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("Push notifications not supported in this browser");
    return null;
  }

  // Register the service worker
  try {
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  } catch (err) {
    console.error("Service worker registration failed:", err);
    return null;
  }

  // Get FCM token
  const token = await requestFCMToken();
  if (!token) return null;

  // Store locally
  localStorage.setItem(FCM_TOKEN_KEY, token);

  // TODO: Send token to your backend
  // await sendTokenToServer(token);

  // Notification sound — unlock audio on first user interaction.
  //
  // Built on first use rather than here. `new Audio(url)` with preload="auto"
  // began downloading the mp3 from S3 the moment FCM initialised, for a sound
  // that only plays if a push actually arrives in the foreground. The element is
  // still created inside the unlockAudio gesture handler, so play() keeps its
  // user-activation.
  let audioUnlocked = false;
  let notificationSound = null;
  const getNotificationSound = () => {
    if (!notificationSound) {
      notificationSound = new Audio(
        "https://shubhastroassets.s3.ap-south-1.amazonaws.com/sound/push-notification.mpeg"
      );
    }
    return notificationSound;
  };

  const unlockAudio = () => {
    if (audioUnlocked) return;
    const sound = getNotificationSound();
    sound.volume = 0;
    sound.play().then(() => {
      sound.pause();
      sound.currentTime = 0;
      sound.volume = 1;
      audioUnlocked = true;
    }).catch(() => {});
  };

  ["click", "touchstart", "keydown"].forEach((evt) =>
    document.addEventListener(evt, unlockAudio, { once: true })
  );

  const playNotificationSound = () => {
    const sound = getNotificationSound();
    sound.currentTime = 0;
    sound.volume = 1;
    sound.play().catch(() => {});
  };

  // Listen for foreground messages
  onForegroundMessage((payload) => {
    // Suppress push notification toast during active calls (call components handle their own notifications)
    if (window.__shubhtalk_call_active) return;

    /*
      Data-only pushes (e.g. the wallet debit after a paid PDF download) carry
      their text in `payload.data`, not `payload.notification`. Reading only the
      latter showed the placeholder "ShubhTalk / You have a new notification".
      Read both — the service worker already does the same for background
      pushes — and show nothing for a push with no text at all (a silent sync
      push): a placeholder toast tells the user nothing.
    */
    const notification = payload?.notification || {};
    const data = payload?.data || {};
    const pickText = (...vals) =>
      vals.find((v) => typeof v === "string" && v.trim())?.trim() || "";
    const title = pickText(notification.title, data.title, data.notificationTitle);
    const body = pickText(notification.body, data.body, data.message, data.notificationBody, data.description);
    const image = pickText(notification.image, data.image, data.imageUrl);
    if (!title && !body) return;

    playNotificationSound();

    toast.custom(
      (t) => (
        <div
          onClick={() => toast.dismiss(t.id)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            background: "#fff",
            borderRadius: "12px",
            padding: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            maxWidth: "360px",
            width: "100%",
            cursor: "pointer",
            opacity: t.visible ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
          role="alert"
        >
          {image && (
            <img
              src={image}
              alt=""
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
                color: "#1a1a1a",
              }}
            >
              {title || "ShubhTalk"}
            </p>
            {body && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "13px",
                fontFamily: "Poppins, sans-serif",
                color: "#666",
                overflow: "hidden",
                // textOverflow: "ellipsis",
                // whiteSpace: "nowrap",
              }}
            >
              {body}
            </p>
            )}
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  });

  return token;
};

/**
 * Returns the stored FCM token (if any).
 */
export const getStoredFCMToken = () => {
  return localStorage.getItem(FCM_TOKEN_KEY);
};

/**
 * Removes the stored FCM token (call on logout).
 */
export const clearFCMToken = () => {
  localStorage.removeItem(FCM_TOKEN_KEY);
};
