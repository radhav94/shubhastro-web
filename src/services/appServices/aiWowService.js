import { privatePost } from '../privateRequest';
import { Toast } from '../../component';

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
        timeout: 30000, // 30 seconds timeout
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Face analysis error:', error);
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      Toast.error('Request timeout. Please try again.');
    } else if (error.response?.status === 413) {
      Toast.error('Image file is too large. Please use a smaller image.');
    } else if (error.response?.status === 415) {
      Toast.error('Invalid image format. Please use JPG, PNG, or WEBP.');
    } else if (!error.response) {
      Toast.error('Network error. Please check your connection.');
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Analysis failed',
    };
  }
};

/**
 * Palmistry Analysis API Service
 * Analyzes palm features from an uploaded image
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @returns {Promise} API response with analysis results
 */
export const analyzePalm = async (imageData) => {
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

    // Add hand type (default to right)
    formData.append('hand', 'right');

    // Add profile data
    const profileData = getProfileData();
    if (profileData) {
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
    }

    const response = await privatePost(
      'wow-suite/palm-analysis/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Palm analysis error:', error);
    
    if (error.code === 'ECONNABORTED') {
      Toast.error('Request timeout. Please try again.');
    } else if (error.response?.status === 413) {
      Toast.error('Image file is too large. Please use a smaller image.');
    } else if (!error.response) {
      Toast.error('Network error. Please check your connection.');
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Analysis failed',
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
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Signature analysis error:', error);
    
    if (error.code === 'ECONNABORTED') {
      Toast.error('Request timeout. Please try again.');
    } else if (error.response?.status === 413) {
      Toast.error('Image file is too large. Please use a smaller image.');
    } else if (!error.response) {
      Toast.error('Network error. Please check your connection.');
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Analysis failed',
    };
  }
};

/**
 * Cloth Color Analysis API Service
 * Analyzes clothing colors and their match with user's aura
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @param {Object} formData - Birth details and intention
 * @returns {Promise} API response with analysis results
 */
export const analyzeClothColor = async (imageData, birthData) => {
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

    // Add birth details
    if (birthData) {
      formData.append('dateOfBirth', birthData.dateOfBirth);
      formData.append('timeOfBirth', birthData.timeOfBirth || '');
      formData.append('placeOfBirth', birthData.placeOfBirth);
      formData.append('analysisDate', birthData.analysisDate);
      formData.append('intention', birthData.intention);
    }

    const response = await privatePost(
      'wow-suite/clothes-color/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Cloth color analysis error:', error);
    
    if (error.code === 'ECONNABORTED') {
      Toast.error('Request timeout. Please try again.');
    } else if (error.response?.status === 413) {
      Toast.error('Image file is too large. Please use a smaller image.');
    } else if (!error.response) {
      Toast.error('Network error. Please check your connection.');
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Analysis failed',
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
  let mimeType = 'image/jpeg';
  if (base64String.startsWith('data:image/png')) {
    mimeType = 'image/png';
  } else if (base64String.startsWith('data:image/webp')) {
    mimeType = 'image/webp';
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
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Gemstone analysis error:', error);
    
    if (error.code === 'ECONNABORTED') {
      Toast.error('Request timeout. Please try again.');
    } else if (error.response?.status === 413) {
      Toast.error('Image file is too large. Please use a smaller image.');
    } else if (!error.response) {
      Toast.error('Network error. Please check your connection.');
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Analysis failed',
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
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please use JPG, PNG, or WEBP format.' 
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
