import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userDetails: null,   // full form data for display
  kundliPayload: null, // transformed data for API calls
  pythonApiPayload:null ,// transformed python api data for API calls
  numerologyPayload: null
};

const monthMap = {
  Jan: 1, January: 1,
  Feb: 2, February: 2,
  Mar: 3, March: 3,
  Apr: 4, April: 4,
  May: 5,
  Jun: 6, June: 6,
  Jul: 7, July: 7,
  Aug: 8, August: 8,
  Sep: 9, September: 9,
  Oct: 10, October: 10,
  Nov: 11, November: 11,
  Dec: 12, December: 12,
};

const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    setForm: (state, action) => {
      const formData = action.payload;

      state.userDetails = formData; // save the full form for UI

      // Generate Kundli payload automatically
      state.kundliPayload = {
        day: Number(formData.day),
        month: monthMap[formData.month] || 1,
        year: Number(formData.year),
        hour: Number(formData.hour),
        min: Number(formData.minute),
        lat: Number(formData.latitude),
        lon: Number(formData.longitude),
        tzone: 5.5,
      };

      state.pythonApiPayload = {
        birth_day: Number(formData.day),
        birth_month: monthMap[formData.month] || 1,
        birth_year: Number(formData.year),
        birth_hour: Number(formData.hour),
        birth_min: Number(formData.minute),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        time_zone: "Asia/Kolkata",
      };
    },
    setNumerologyPayload: (state, action) => {
      const { name, date } = action.payload;

      state.numerologyPayload = {
        name,           // string
        date,           // "DD/MM/YYYY"
        lang: "en",
      };
    },

    clearForm: (state) => {
      state.userDetails = null;
      state.kundliPayload = null;
      state.pythonApiPayload = null;
    },
  },
});

export const { setForm, setNumerologyPayload, clearForm } = formSlice.actions;
export default formSlice.reducer;
