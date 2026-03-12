const SESSION_KEY = "shubhtalk_live_viewer_session";

export const saveViewerSession = (data) => {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        token: data.token,
        channel: data.channel,
        uid: data.uid,
        chatRoomId: data.chatRoomId,
        astrologer: data.astrologer,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn("Failed to save viewer session", e);
  }
};

export const restoreViewerSession = () => {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to restore viewer session", e);
  }
  return null;
};

export const clearViewerSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};
