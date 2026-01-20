import { useEffect, useState } from "react";

/**
 * Reusable hook to hydrate form state from localStorage
 * @param {string} storageKey
 * @param {object} initialState
 */
const useFormFromLocalStorage = (storageKey, initialState) => {
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch (err) {
      console.error(`Failed to read ${storageKey} from localStorage`, err);
    }
  }, [storageKey]);

  return [formData, setFormData];
};

export default useFormFromLocalStorage;
