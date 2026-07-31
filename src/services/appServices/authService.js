import privateRequest from "../privateRequest";
import publicRequest from "../publicRequest";

export const loginWithPhone = async (data) => {
  return await publicRequest.post("users/loginUser", data);
};

let _verifyOtpInFlight = null;

export const verifyOtp = async (data,config = {}) => {
  // Prevent duplicate concurrent calls — return the same promise if one is already in flight
  if (_verifyOtpInFlight) return _verifyOtpInFlight;
  _verifyOtpInFlight = publicRequest.post("users/verifyOtp", data,config).finally(() => {
    _verifyOtpInFlight = null;
  });
  return _verifyOtpInFlight;
}


export const logout = async (data) => {
  return await publicRequest.post("users/verifyOtp", data);
};

export const registerUser = async (data, config = {}) => {
  return await privateRequest.post("users/registerUser", data, config);
};

export const getAstrologerLiveList = async (data) => {
  const token = localStorage.getItem("shubhtalk_customer_token") || localStorage.getItem("shubhtalk_astro_token");
  if (token) {
    return await privateRequest.get("users/live-users", data);
  }
  return await publicRequest.get("users/live-users", data);
};

export const getViewerToken = async (channel, { guestId } = {}) => {
  if (guestId) {
    // Guest user — no auth header, pass guestId in body
    return await publicRequest.post(
      "users/live/token/viewer",
      { channel, guestId },
      { skipToast: true }
    );
  }
  return await privateRequest.post(
    `users/live/token/viewer?channel=${channel}`,
    {},
    { skipToast: true }
  );
};

export const getReconnectToken = async (channel) => {
  return await privateRequest.post("users/live/reconnect-token", { channel });
};

export const refreshAgoraToken = async (channel, uid) => {
  return await privateRequest.post("users/live/refresh-token", { channel, uid });
}

export const updateUserProfile = async (data) => {
  return await privateRequest.put("users/profile", data);
};

export const deleteAccount = async () => {
  return await privateRequest.delete("users/delete-account");
};

// ── Live Chat REST APIs ──

export const getActiveLiveRooms = async (page = 1, limit = 10) => {
  return await privateRequest.get(
    `live-chat/active-rooms?page=${page}&limit=${limit}`
  );
};

export const getLiveRoomDetails = async (roomId) => {
  return await privateRequest.get(`live-chat/room/${roomId}`);
};

export const getLiveRoomMessages = async (roomId, limit = 50) => {
  return await privateRequest.get(
    `live-chat/room/${roomId}/messages?limit=${limit}`
  );
};

export const getLiveRoomParticipants = async (roomId) => {
  return await privateRequest.get(`live-chat/room/${roomId}/participants`);
};

