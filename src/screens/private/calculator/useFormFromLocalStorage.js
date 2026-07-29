import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCalculatorData, selectCalculatorData } from "../../../redux/calculator/calculatorSlice";

/**
 * Reusable hook for calculator form state backed by Redux.
 * @param {string} storageKey - the key used in the calculator Redux slice
 * @param {object} initialState - default form values
 */
const useFormFromLocalStorage = (storageKey, initialState) => {
  const dispatch = useDispatch();
  const storedData = useSelector(selectCalculatorData(storageKey));
  // The calculator slice is persisted to localStorage, so a previously
  // logged-in user's saved inputs would otherwise pre-fill the form for a
  // guest. Only restore persisted data when the user is logged in.
  const isLoggedIn = !!localStorage.getItem("shubhtalk_customer_token");
  const [formData, setFormData] = useState(isLoggedIn && storedData ? storedData : initialState);

  // Sync local state if Redux state changes externally (logged-in users only)
  useEffect(() => {
    if (isLoggedIn && storedData) {
      setFormData(storedData);
    }
  }, [storedData, isLoggedIn]);

  return [formData, setFormData];
};

export default useFormFromLocalStorage;
