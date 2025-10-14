import publicRequest from "../publicRequest";

export const loginWithPhone = async (data) => {
  return await publicRequest.post("/login", data);
};
