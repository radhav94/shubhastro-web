import { createSlice } from "@reduxjs/toolkit";

const remedySlice = createSlice({
  name: "remedy",
  initialState: {
    suggestedProducts: [],
    messages: [],
    hasNewRemedy: false,
  },
  reducers: {
    addRemedy(state, action) {
      const { suggestedProducts, message } = action.payload;
      state.suggestedProducts.push(...suggestedProducts);
      if (message) state.messages.push(message);
      state.hasNewRemedy = true;
    },
    clearNewRemedy(state) {
      state.hasNewRemedy = false;
    },
    clearAllRemedy() {
      return { suggestedProducts: [], messages: [], hasNewRemedy: false };
    },
  },
});

export const { addRemedy, clearNewRemedy, clearAllRemedy } = remedySlice.actions;
export default remedySlice.reducer;
