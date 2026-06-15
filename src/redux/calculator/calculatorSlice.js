import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sun_sign: null,
  rising_sign: null,
  rashi_moon_sign: null,
  numerology_report: null,
  dasha_calc: null,
  kaal_sarp: null,
  mangal_dosha: null,
  shani_sade_sati: null,
  love_calculator: null,
  flames_calculator: null,
  friendship_calculator: null,
  mobile_calculator: null,
  vehicle_calculator: null,
  age_calculator: null,
  destiny_calc: null,
  birth_natal_calc: null,
  "atmakaraka-and-darakaraka": null,
  mulank_calc: null,
  name_compatibility_calc: null,
  loshu_grid_calc: null,
  lucky_name_calc: null,
};

const calculatorSlice = createSlice({
  name: "calculator",
  initialState,
  reducers: {
    setCalculatorData: (state, action) => {
      const { key, data } = action.payload;
      state[key] = data;
    },
    clearCalculatorData: (state, action) => {
      state[action.payload] = null;
    },
    clearAllCalculatorData: () => initialState,
  },
});

export const { setCalculatorData, clearCalculatorData, clearAllCalculatorData } =
  calculatorSlice.actions;

export const selectCalculatorData = (key) => (state) => state.calculator[key];

export default calculatorSlice.reducer;
