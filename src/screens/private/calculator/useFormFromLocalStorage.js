import { useState } from "react";

/**
 * Reusable hook for calculator form state.
 * Always starts fresh — no persistence across refresh or navigation.
 * @param {string} storageKey - kept for API compatibility (used on submit)
 * @param {object} initialState
 */
const useFormFromLocalStorage = (storageKey, initialState) => {
  const [formData, setFormData] = useState(initialState);

  return [formData, setFormData];
};

export default useFormFromLocalStorage;
