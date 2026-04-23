import { createSlice } from "@reduxjs/toolkit";

const remedySlice = createSlice({
  name: "remedy",
  initialState: {
    entries: [],
    hasNewRemedy: false,
  },
  reducers: {
    addRemedy(state, action) {
      const { suggestedProducts, message } = action.payload;
      state.entries.push({
        message: message || null,
        products: suggestedProducts || [],
        timestamp: Date.now(),
      });
      state.hasNewRemedy = true;
    },
    clearNewRemedy(state) {
      state.hasNewRemedy = false;
    },
    clearAllRemedy() {
      return { entries: [], hasNewRemedy: false };
    },
  },
});

export const { addRemedy, clearNewRemedy, clearAllRemedy } = remedySlice.actions;
export default remedySlice.reducer;
