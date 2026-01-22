import { privatePost } from '../privateRequest';

/**
 * Helper function to get profile data from localStorage
 * @returns {Object} Profile data with birth details
 */
export const getProfileData = () => {
  const profileStr = localStorage.getItem('selectedKundliProfile');
  if (!profileStr) return null;
  
  try {
    const profile = JSON.parse(profileStr);
    return {
      name: profile.name || '',
      gender: profile.identity?.toLowerCase() || 'male',
      day: String(profile.day || ''),
      month: String(profile.month || ''),
      year: String(profile.year || ''),
      hour: String(profile.hour || '0'),
      min: String(profile.minute || '0'),
      second: '0',
      place: profile.place || '',
      lat: String(profile.latitude || '0'),
      lon: String(profile.longitude || '0'),
      tzone: String(profile.timezone || '5.5'),
    };
  } catch (error) {
    console.error('Error parsing profile data:', error);
    return null;
  }
};

/**
 * Face Analysis API Service
 * Analyzes facial features from an uploaded image
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @returns {Promise} API response with analysis results
 */
export const analyzeFace = async (imageData) => {
  try {
    const formData = new FormData();
    
    // Handle different image data types
    if (imageData instanceof File || imageData instanceof Blob) {
      formData.append('image', imageData);
    } else if (typeof imageData === 'string') {
      // Convert base64 to blob if needed
      const blob = await base64ToBlob(imageData);
      formData.append('image', blob, 'face-image.jpg');
    } else {
      throw new Error('Invalid image data format');
    }

    // Add profile data
    const profileData = getProfileData();
    if (profileData) {
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
    }

    const response = await privatePost(
      'wow-suite/face-analysis/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout for AI processing
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Face analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    const errorCode = errorData?.error?.code || error.response?.status || 'UNKNOWN_ERROR';
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Analysis failed'
    );
    
    // Handle specific error cases (interceptor already showed toast)
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout. Please try again.',
        code: 'TIMEOUT'
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: 'Image file is too large',
        code: 'FILE_TOO_LARGE'
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: 'Invalid image format',
        code: 'INVALID_FORMAT'
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: errorMessage,
        code: 'SERVER_ERROR'
      };
    } else if (errorData?.error?.code === 'AI_ERROR') {
      return {
        success: false,
        error: errorMessage,
        code: 'AI_ERROR'
      };
    } else if (!error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: errorMessage,
      code: errorCode
    };
  }
};

/**
 * Palmistry Analysis API Service
 * Analyzes palm features from an uploaded image
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @param {string} hand - Hand type ('left' or 'right')
 * @returns {Promise} API response with analysis results
 */
export const analyzePalm = async (imageData, hand = 'right') => {
  try {
    const formData = new FormData();
    
    if (imageData instanceof File || imageData instanceof Blob) {
      formData.append('palmImage', imageData);
    } else if (typeof imageData === 'string') {
      const blob = await base64ToBlob(imageData);
      formData.append('palmImage', blob, 'palm-image.jpg');
    } else {
      throw new Error('Invalid image data format');
    }

    // Add hand type
    formData.append('hand', hand);

    // Add profile data
    const profileData = getProfileData();
    if (profileData) {
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
    }

    const response = await privatePost(
      'wow-suite/palmistry/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Palm analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    const errorCode = errorData?.error?.code || error.response?.status || 'UNKNOWN_ERROR';
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Analysis failed'
    );
    
    // Handle specific error cases (interceptor already showed toast)
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout. Please try again.',
        code: 'TIMEOUT'
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: 'Image file is too large',
        code: 'FILE_TOO_LARGE'
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: 'Invalid image format',
        code: 'INVALID_FORMAT'
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: errorMessage,
        code: 'SERVER_ERROR'
      };
    } else if (errorData?.error?.code === 'AI_ERROR') {
      return {
        success: false,
        error: errorMessage,
        code: 'AI_ERROR'
      };
    } else if (!error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: errorMessage,
      code: errorCode
    };
  }
};

/**
 * Signature Analysis API Service
 * Analyzes signature features from an uploaded image
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @returns {Promise} API response with analysis results
 */
export const analyzeSignature = async (imageData) => {
  try {
    const formData = new FormData();
    
    if (imageData instanceof File || imageData instanceof Blob) {
      formData.append('signatureImage', imageData);
    } else if (typeof imageData === 'string') {
      const blob = await base64ToBlob(imageData);
      formData.append('signatureImage', blob, 'signature-image.jpg');
    } else {
      throw new Error('Invalid image data format');
    }

    // Add profile data
    const profileData = getProfileData();
    if (profileData) {
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
    }

    const response = await privatePost(
      'wow-suite/signature/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Signature analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    const errorCode = errorData?.error?.code || error.response?.status || 'UNKNOWN_ERROR';
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Analysis failed'
    );
    
    // Handle specific error cases (interceptor already showed toast)
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout. Please try again.',
        code: 'TIMEOUT'
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: 'Image file is too large',
        code: 'FILE_TOO_LARGE'
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: 'Invalid image format',
        code: 'INVALID_FORMAT'
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: errorMessage,
        code: 'SERVER_ERROR'
      };
    } else if (errorData?.error?.code === 'AI_ERROR') {
      return {
        success: false,
        error: errorMessage,
        code: 'AI_ERROR'
      };
    } else if (!error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: errorMessage,
      code: errorCode
    };
  }
};

/**
 * Cloth Color Analysis API Service
 * Analyzes clothing colors and their match with user's aura
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @param {Object} intentionData - Intention for the day
 * @returns {Promise} API response with analysis results
 */
export const analyzeClothColor = async (imageData, intentionData) => {
  try {
    const formData = new FormData();
    
    // Add image
    if (imageData instanceof File || imageData instanceof Blob) {
      formData.append('wardrobeImage', imageData);
    } else if (typeof imageData === 'string') {
      const blob = await base64ToBlob(imageData);
      formData.append('wardrobeImage', blob, 'cloth-color-image.jpg');
    } else {
      throw new Error('Invalid image data format');
    }

    // Add intention
    if (intentionData?.intention) {
      formData.append('intention', intentionData.intention);
    }

    // Add current date as analysisDate (format: YYYY-MM-DD)
    const analysisDate = new Date().toISOString().split('T')[0];
    formData.append('analysisDate', analysisDate);

    // Add profile data from Kundli
    const profileData = getProfileData();
    if (profileData) {
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
    }

    const response = await privatePost(
      'wow-suite/clothes-color/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Cloth color analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    const errorCode = errorData?.error?.code || error.response?.status || 'UNKNOWN_ERROR';
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Analysis failed'
    );
    
    // Handle specific error cases (interceptor already showed toast)
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout. Please try again.',
        code: 'TIMEOUT'
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: 'Image file is too large',
        code: 'FILE_TOO_LARGE'
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: 'Invalid image format',
        code: 'INVALID_FORMAT'
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: errorMessage,
        code: 'SERVER_ERROR'
      };
    } else if (errorData?.error?.code === 'AI_ERROR') {
      return {
        success: false,
        error: errorMessage,
        code: 'AI_ERROR'
      };
    } else if (!error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: errorMessage,
      code: errorCode
    };
  }
};

/**
 * Helper function to convert base64 string to Blob
 * @param {string} base64String - Base64 encoded image string
 * @returns {Promise<Blob>} Blob object
 */
const base64ToBlob = async (base64String) => {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Determine MIME type from base64 string
  let mimeType = 'image/jpeg'; // default
  if (base64String.startsWith('data:image/png')) {
    mimeType = 'image/png';
  } else if (base64String.startsWith('data:image/webp')) {
    mimeType = 'image/webp';
  } else if (base64String.startsWith('data:image/heic')) {
    mimeType = 'image/heic';
  } else if (base64String.startsWith('data:image/heif')) {
    mimeType = 'image/heif';
  } else if (base64String.startsWith('data:image/bmp')) {
    mimeType = 'image/bmp';
  } else if (base64String.startsWith('data:image/gif')) {
    mimeType = 'image/gif';
  } else if (base64String.startsWith('data:image/tiff')) {
    mimeType = 'image/tiff';
  }
  
  return new Blob([bytes], { type: mimeType });
};

/**
 * Gemstone Analysis API Service
 * Analyzes gemstone authenticity from an uploaded image
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @returns {Promise} API response with analysis results
 */
export const analyzeGemstone = async (imageData) => {
  try {
    const formData = new FormData();
    
    if (imageData instanceof File || imageData instanceof Blob) {
      formData.append('image', imageData);
    } else if (typeof imageData === 'string') {
      const blob = await base64ToBlob(imageData);
      formData.append('image', blob, 'gemstone-image.jpg');
    } else {
      throw new Error('Invalid image data format');
    }

    // Add profile data
    const profileData = getProfileData();
    if (profileData) {
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
    }

    const response = await privatePost(
      'wow-suite/gemstone-scanner/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Gemstone analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    const errorCode = errorData?.error?.code || error.response?.status || 'UNKNOWN_ERROR';
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Analysis failed'
    );
    
    // Handle specific error cases (interceptor already showed toast)
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout. Please try again.',
        code: 'TIMEOUT'
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: 'Image file is too large',
        code: 'FILE_TOO_LARGE'
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: 'Invalid image format',
        code: 'INVALID_FORMAT'
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: errorMessage,
        code: 'SERVER_ERROR'
      };
    } else if (errorData?.error?.code === 'AI_ERROR') {
      return {
        success: false,
        error: errorMessage,
        code: 'AI_ERROR'
      };
    } else if (!error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: errorMessage,
      code: errorCode
    };
  }
};

/**
 * Validate image file before upload
 * @param {File} file - Image file to validate
 * @returns {Object} Validation result
 */
export const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp',
    'image/heic',
    'image/heif',
    'image/bmp',
    'image/gif',
    'image/tiff',
    'image/svg+xml'
  ];
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please use common image formats (JPG, PNG, WEBP, HEIC, BMP, GIF, etc.).' 
    };
  }
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'File size exceeds 5MB. Please use a smaller image.' 
    };
  }
  
  return { valid: true };
};
