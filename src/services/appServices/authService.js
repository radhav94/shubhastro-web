import publicRequest from "../publicRequest";

export const loginWithPhone = async (data) => {
  return await publicRequest.post("/loginUser", data);
};

export const verifyOtp = async (data) => {
  return await publicRequest.post("/verifyOtp", data);
};
