import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedKundli: null, // { _id, name, details, ... }
};

const kundliSlice = createSlice({
  name: "kundli",
  initialState,
  reducers: {
    setSelectedKundli: (state, action) => {
      state.selectedKundli = action.payload;
    },
    clearSelectedKundli: (state) => {
      state.selectedKundli = null;
    },
  },
});

export const { setSelectedKundli, clearSelectedKundli } = kundliSlice.actions;
export default kundliSlice.reducer;
