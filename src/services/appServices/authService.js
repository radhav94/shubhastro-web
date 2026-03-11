import privateRequest from "../privateRequest";
import publicRequest from "../publicRequest";

export const loginWithPhone = async (data) => {
  return await publicRequest.post("users/loginUser", data);
};

export const verifyOtp = async (data) => {
  return await publicRequest.post("users/verifyOtp", data);
};

export const logout = async (data) => {
  return await publicRequest.post("users/verifyOtp", data);
};

export const registerUser = async (data) => {
  return await privateRequest.post("users/registerUser", data);
};

export const getAstrologerLiveList = async (data) => {
  return await privateRequest.get("users/live-users", data);
};

export const getViewerToken = async (channel) => {
  return await privateRequest.post(
    `users/live/token/viewer?channel=${channel}`
  );
};

export const getReconnectToken = async (channel) => {
  return await privateRequest.post("users/live/reconnect-token", { channel });
};

export const refreshAgoraToken = async (channel, uid) => {
  return await privateRequest.post("users/live/refresh-token", { channel, uid });
}

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
