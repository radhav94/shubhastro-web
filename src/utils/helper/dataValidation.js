/**
 * Utility functions for safe data access and validation in AI Wow modules
 */

/**
 * Safely get nested object property with fallback
 * @param {Object} obj - The object to access
 * @param {string} path - Dot notation path (e.g., 'user.profile.name')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} The value at path or defaultValue
 */
export const safeGet = (obj, path, defaultValue = null) => {
  try {
    if (!obj || typeof obj !== 'object') return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    console.warn(`safeGet error for path "${path}":`, error);
    return defaultValue;
  }
};

/**
 * Validate image data format
 * @param {*} imageData - The image data to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateImageData = (imageData) => {
  if (!imageData) {
    return { isValid: false, error: 'No image data provided' };
  }
  
  if (typeof imageData !== 'string') {
    return { isValid: false, error: 'Image data must be a string' };
  }
  
  if (!imageData.startsWith('data:image/')) {
    return { isValid: false, error: 'Invalid image format. Must be a data URL' };
  }
  
  // Check if image is too large (e.g., > 10MB base64)
  if (imageData.length > 10 * 1024 * 1024 * 1.37) { // Base64 is ~37% larger
    return { isValid: false, error: 'Image file is too large (max 10MB)' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate API response structure
 * @param {*} response - The API response to validate
 * @param {Array<string>} requiredFields - Required fields in response.data
 * @returns {Object} { isValid: boolean, error: string|null, data: Object|null }
 */
export const validateApiResponse = (response, requiredFields = []) => {
  if (!response || typeof response !== 'object') {
    return { 
      isValid: false, 
      error: 'Invalid response format', 
      data: null 
    };
  }
  
  if (!response.success) {
    return { 
      isValid: false, 
      error: response.error?.message || response.message || 'Request failed', 
      data: null 
    };
  }
  
  if (!response.data) {
    return { 
      isValid: false, 
      error: 'No data in response', 
      data: null 
    };
  }
  
  // Check required fields
  const missingFields = requiredFields.filter(field => {
    const value = safeGet(response.data, field);
    return value === null || value === undefined;
  });
  
  if (missingFields.length > 0) {
    console.warn('Missing required fields:', missingFields);
    // Don't fail, just warn - data might still be usable
  }
  
  return { 
    isValid: true, 
    error: null, 
    data: response.data 
  };
};

/**
 * Sanitize and validate analysis result data
 * @param {*} data - The analysis data to sanitize
 * @param {string} moduleType - Type of module (aura, palmistry, etc.)
 * @returns {Object} Sanitized data with safe defaults
 */
export const sanitizeAnalysisData = (data, moduleType = 'generic') => {
  if (!data || typeof data !== 'object') {
    console.error(`Invalid ${moduleType} analysis data:`, data);
    return null;
  }
  
  // Create a safe copy
  const sanitized = { ...data };
  
  // Ensure arrays are actually arrays
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
      // It's an object, keep it
    } else if (sanitized[key] === null || sanitized[key] === undefined) {
      // Set safe defaults based on expected type
      if (key.includes('list') || key.includes('array') || key.includes('items')) {
        sanitized[key] = [];
      } else if (key.includes('score') || key.includes('percentage')) {
        sanitized[key] = 0;
      } else if (key.includes('description') || key.includes('text') || key.includes('message')) {
        sanitized[key] = '';
      }
    }
  });
  
  return sanitized;
};

/**
 * Get error message from various error formats
 * @param {*} error - Error object, string, or response
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // String error
  if (typeof error === 'string') return error;
  
  // Error object with message
  if (error.message) {
    // Network errors
    if (error.message === 'Network Error' || error.message === 'Failed to fetch') {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message;
  }
  
  // API error response
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 400) return data?.message || 'Invalid request. Please try again.';
    if (status === 401) return 'Authentication required. Please log in.';
    if (status === 403) return 'Access denied. You don\'t have permission.';
    if (status === 404) return 'Service not found. Please try again later.';
    if (status === 413) return 'Image file is too large. Please use a smaller image.';
    if (status === 429) return 'Too many requests. Please wait a moment and try again.';
    if (status >= 500) return 'Server error. Please try again later.';
    
    return data?.message || `Request failed with status ${status}`;
  }
  
  // Structured error object
  if (error.error) {
    return getErrorMessage(error.error);
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if Redux state has valid data
 * @param {*} state - Redux state slice
 * @param {Array<string>} requiredFields - Required fields to check
 * @returns {Object} { isValid: boolean, missingFields: Array<string> }
 */
export const validateReduxState = (state, requiredFields = []) => {
  if (!state || typeof state !== 'object') {
    return { isValid: false, missingFields: ['state'] };
  }
  
  const missingFields = requiredFields.filter(field => {
    const value = safeGet(state, field);
    return value === null || value === undefined;
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Safe array access with fallback
 * @param {*} arr - Array to access
 * @param {number} index - Index to access
 * @param {*} defaultValue - Default value if index doesn't exist
 * @returns {*} Value at index or defaultValue
 */
export const safeArrayGet = (arr, index, defaultValue = null) => {
  if (!Array.isArray(arr)) return defaultValue;
  if (index < 0 || index >= arr.length) return defaultValue;
  return arr[index] !== undefined ? arr[index] : defaultValue;
};

/**
 * Safe number parsing with fallback
 * @param {*} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed number or defaultValue
 */
export const safeParseNumber = (value, defaultValue = 0) => {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safe string conversion
 * @param {*} value - Value to convert
 * @param {string} defaultValue - Default value if conversion fails
 * @returns {string} String value or defaultValue
 */
export const safeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};
