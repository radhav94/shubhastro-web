import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toast } from '../../../../component';
import { safeGet, sanitizeAnalysisData, validateReduxState } from '../../../../utils/helper/dataValidation';
import { trackEvent } from '../../../../utils/analytics';

/**
 * Custom hook for safely accessing and validating AI Wow analysis results
 * @param {string} moduleName - Name of the module (aura, palmistry, etc.)
 * @param {Array<string>} requiredFields - Required fields in the result data
 * @returns {Object} { data, image, loading, error, safeGet: helper function }
 */
export const useAIWowResult = (moduleName, requiredFields = []) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validatedData, setValidatedData] = useState(null);

  // Get data from Redux
  const result = useSelector((state) => safeGet(state, `aiwow.${moduleName}.result`));
  const image = useSelector((state) => safeGet(state, `aiwow.${moduleName}.image`));

  useEffect(() => {
    const validateAndSetData = () => {
      try {
        // Check if result exists
        if (!result) {
          console.error(`No ${moduleName} result found in Redux state`);
          Toast.error('No analysis results found. Please analyze first.');
          navigate(`/aiwow/${moduleName}/instructions`);
          return;
        }

        // Validate result is an object
        if (typeof result !== 'object') {
          console.error(`Invalid ${moduleName} result type:`, typeof result);
          Toast.error('Invalid analysis data format. Please try again.');
          navigate(`/aiwow/${moduleName}/instructions`);
          return;
        }

        // Handle nested data structure (result.data or result directly)
        const actualData = result.data || result;

        // Validate required fields if specified
        if (requiredFields.length > 0) {
          const validation = validateReduxState(actualData, requiredFields);
          
          if (!validation.isValid) {
            console.warn(`Missing required fields in ${moduleName}:`, validation.missingFields);
            // Don't fail completely, just warn
            setError(`Some analysis data may be incomplete: ${validation.missingFields.join(', ')}`);
          }
        }

        // Sanitize the data
        const sanitized = sanitizeAnalysisData(actualData, moduleName);
        
        if (!sanitized) {
          throw new Error('Failed to sanitize analysis data');
        }

        setValidatedData(sanitized);
        setLoading(false);
        trackEvent("shubh_ai_report_viewed", { feature_name: moduleName });
      } catch (err) {
        console.error(`Error validating ${moduleName} result:`, err);
        Toast.error('Failed to load analysis results. Please try again.');
        navigate(`/aiwow/${moduleName}/instructions`);
      }
    };

    validateAndSetData();
  }, [result, moduleName, navigate, requiredFields]);

  /**
   * Safe getter with fallback for nested properties
   */
  const safeGetData = (path, defaultValue = null) => {
    return safeGet(validatedData, path, defaultValue);
  };

  return {
    data: validatedData,
    image,
    loading,
    error,
    safeGet: safeGetData,
  };
};

/**
 * Hook for safely accessing array data with validation
 * @param {Array} arr - Array to access
 * @param {*} defaultValue - Default value if array is invalid
 * @returns {Array} Validated array
 */
export const useSafeArray = (arr, defaultValue = []) => {
  if (!Array.isArray(arr)) {
    console.warn('Expected array but got:', typeof arr);
    return defaultValue;
  }
  return arr;
};

/**
 * Hook for safely rendering conditional content
 * @param {*} data - Data to check
 * @param {Function} renderFn - Function to render if data exists
 * @param {*} fallback - Fallback content if data doesn't exist
 * @returns {*} Rendered content or fallback
 */
export const useSafeRender = (data, renderFn, fallback = null) => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return fallback;
  }
  
  try {
    return renderFn(data);
  } catch (error) {
    console.error('Error rendering content:', error);
    return fallback;
  }
};

export default useAIWowResult;
