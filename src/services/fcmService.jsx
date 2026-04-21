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

  // Notification sound — unlock audio on first user interaction
  let audioUnlocked = false;
  const notificationSound = new Audio("/notification.mp3");
  notificationSound.preload = "auto";

  const unlockAudio = () => {
    if (audioUnlocked) return;
    notificationSound.volume = 0;
    notificationSound.play().then(() => {
      notificationSound.pause();
      notificationSound.currentTime = 0;
      notificationSound.volume = 1;
      audioUnlocked = true;
    }).catch(() => {});
  };

  ["click", "touchstart", "keydown"].forEach((evt) =>
    document.addEventListener(evt, unlockAudio, { once: true })
  );

  const playNotificationSound = () => {
    notificationSound.currentTime = 0;
    notificationSound.volume = 1;
    notificationSound.play().catch(() => {});
  };

  // Listen for foreground messages
  onForegroundMessage((payload) => {
    playNotificationSound();
    const { title, body, image } = payload.notification || {};

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
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "13px",
                fontFamily: "Poppins, sans-serif",
                color: "#666",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {body || "You have a new notification"}
            </p>
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
