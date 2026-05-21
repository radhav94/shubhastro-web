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
  const [formData, setFormData] = useState(storedData || initialState);

  // Sync local state if Redux state changes externally
  useEffect(() => {
    if (storedData) {
      setFormData(storedData);
    }
  }, [storedData]);

  return [formData, setFormData];
};

export default useFormFromLocalStorage;
