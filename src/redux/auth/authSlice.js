import { createSlice } from "@reduxjs/toolkit";

// Check if user is logged in on app initialization
const getInitialAuthState = () => {
  const role = localStorage.getItem("shubhtalk_role");
  const token = role === "ASTROLOGER"
    ? localStorage.getItem("shubhtalk_astro_token")
    : localStorage.getItem("shubhtalk_customer_token");
  
  return {
    isLoggedIn: !!token, // true if token exists
    token: token || null,
    isRegister: false,
    isVerified: false,
  };
};

const initialState = getInitialAuthState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isLoggedIn = true;
      state.isRegister = action.payload.isRegister;
      state.isVerified = action.payload.isVerified;
      //   state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      //   state.user = null;
      state.token = null;
      state.isRegister = false;
      state.isVerified = false;
    },
    updateRegistrationStatus: (state, action) => {
      state.isRegister = action.payload.isRegister;
    },
  },
});

export const { loginSuccess, logout, updateRegistrationStatus } = authSlice.actions;
export default authSlice.reducer;
