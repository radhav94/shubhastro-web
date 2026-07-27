import { privatePost, privateGet } from '../privateRequest';
import { trackEvent } from '../../utils/analytics';

/**
 * Helper function to get profile data from localStorage
 * @returns {Object} Profile data with birth details
 */
export const getProfileData = () => {
  const profileStr = localStorage.getItem('selectedKundliProfile');
  if (!profileStr) return null;
  
  try {
    const profile = JSON.parse(profileStr);
    const rawId = profile._id || profile.id || '';
    const kundliId = rawId.startsWith('temp_') ? '' : rawId;
    return {
      kundliId,
      name: profile.name || '',
      gender: profile.identity?.toLowerCase() || 'male',
      day: String(profile.day || ''),
      month: String(profile.month || ''),
      year: String(profile.year || ''),
      hour: String(profile.hour || '0'),
      min: String(profile.min || '0'),
      second: String(profile.second || '0'),
      place: profile.place || '',
      lat: String(profile.lat || '0'),
      lon: String(profile.lon || '0'),
      tzone: String(profile.tzone || '5.5'),
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
 * @param {AbortSignal} signal - Optional abort signal to cancel request
 * @returns {Promise} API response with analysis results
 */
// OLD CODE (commented out for reference):
// export const analyzeFace = async (imageData) => {
// NEW CODE (with abort signal support):
export const analyzeFace = async (imageData, signal = null) => {
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
        signal, // Pass abort signal to axios
      }
    );

    trackEvent("shubh_ai_report_generated", { feature_name: "astro-face-reading" });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Face analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    
    // Return full error structure if available
    if (errorData?.error) {
      return {
        success: false,
        error: {
          code: errorData.error.code || 'UNKNOWN_ERROR',
          message: errorData.error.message || 'Analysis failed',
          details: errorData.error.details || null
        }
      };
    }
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timeout. Please try again.',
          details: null
        }
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Image file is too large',
          details: null
        }
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid image format',
          details: null
        }
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: errorData?.message || 'Server error occurred',
          details: null
        }
      };
    } else if (!error.response) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
          details: null
        }
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: errorData?.message || error.message || 'Analysis failed',
        details: null
      }
    };
  }
};

/**
 * Palmistry Analysis API Service
 * Analyzes palm features from an uploaded image
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @param {string} hand - Hand type ('left' or 'right')
 * @param {AbortSignal} signal - Optional abort signal to cancel request
 * @returns {Promise} API response with analysis results
 */
export const analyzePalm = async (imageData, hand = 'right', signal = null) => {
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
        signal, // Pass abort signal to axios
      }
    );

    trackEvent("shubh_ai_report_generated", { feature_name: "ai-palmistry-scanner" });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Palm analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    
    // Return full error structure if available
    if (errorData?.error) {
      return {
        success: false,
        error: {
          code: errorData.error.code || 'UNKNOWN_ERROR',
          message: errorData.error.message || 'Analysis failed',
          details: errorData.error.details || null
        }
      };
    }
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timeout. Please try again.',
          details: null
        }
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Image file is too large',
          details: null
        }
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid image format',
          details: null
        }
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: errorData?.message || 'Server error occurred',
          details: null
        }
      };
    } else if (!error.response) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
          details: null
        }
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: errorData?.message || error.message || 'Analysis failed',
        details: null
      }
    };
  }
};

/**
 * Signature Analysis API Service
 * Analyzes signature features from an uploaded image
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @param {AbortSignal} signal - Optional abort signal to cancel request
 * @returns {Promise} API response with analysis results
 */
export const analyzeSignature = async (imageData, signal = null) => {
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
        signal, // Pass abort signal to axios
      }
    );

    trackEvent("shubh_ai_report_generated", { feature_name: "signature-analysis" });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Signature analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    
    // Return full error structure if available
    if (errorData?.error) {
      return {
        success: false,
        error: {
          code: errorData.error.code || 'UNKNOWN_ERROR',
          message: errorData.error.message || 'Analysis failed',
          details: errorData.error.details || null
        }
      };
    }
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timeout. Please try again.',
          details: null
        }
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Image file is too large',
          details: null
        }
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid image format',
          details: null
        }
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: errorData?.message || 'Server error occurred',
          details: null
        }
      };
    } else if (!error.response) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
          details: null
        }
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: errorData?.message || error.message || 'Analysis failed',
        details: null
      }
    };
  }
};

/**
 * Cloth Color Analysis API Service
 * Analyzes clothing colors and their match with user's aura
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @param {Object} intentionData - Intention for the day
 * @param {AbortSignal} signal - Optional abort signal to cancel request
 * @returns {Promise} API response with analysis results
 */
export const analyzeClothColor = async (imageData, intentionData, signal = null) => {
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
        signal, // Pass abort signal to axios
      }
    );

    trackEvent("shubh_ai_report_generated", { feature_name: "clothes-colour-analysis" });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Cloth color analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    
    // Return full error structure if available
    if (errorData?.error) {
      return {
        success: false,
        error: {
          code: errorData.error.code || 'UNKNOWN_ERROR',
          message: errorData.error.message || 'Analysis failed',
          details: errorData.error.details || null
        }
      };
    }
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timeout. Please try again.',
          details: null
        }
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Image file is too large',
          details: null
        }
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid image format',
          details: null
        }
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: errorData?.message || 'Server error occurred',
          details: null
        }
      };
    } else if (!error.response) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
          details: null
        }
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: errorData?.message || error.message || 'Analysis failed',
        details: null
      }
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
 * Aura Analysis API Service
 * Analyzes aura colors and energy from an uploaded image
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @returns {Promise} API response with analysis results
 */
export const analyzeAura = async (imageData, signal = null) => {
  try {
    const formData = new FormData();
    
    if (imageData instanceof File || imageData instanceof Blob) {
      formData.append('image', imageData);
    } else if (typeof imageData === 'string') {
      const blob = await base64ToBlob(imageData);
      formData.append('image', blob, 'aura-image.jpg');
    } else {
      throw new Error('Invalid image data format');
    }

    // Add profile data
    const profileData = getProfileData();
    if (profileData) {
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
      
      // Add sun sign, moon sign, and ascendant if available
      const kundliData = localStorage.getItem('selectedKundliProfile');
      if (kundliData) {
        try {
          const kundli = JSON.parse(kundliData);
          if (kundli.sunSign) formData.append('sunSign', kundli.sunSign);
          if (kundli.moonSign) formData.append('moonSign', kundli.moonSign);
          if (kundli.ascendant) formData.append('ascendant', kundli.ascendant);
        } catch (e) {
          console.error('Error parsing kundli data:', e);
        }
      }
    }

    const response = await privatePost(
      'wow-suite/aura/generate',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
        signal, // Pass abort signal to axios
      }
    );

    trackEvent("shubh_ai_report_generated", { feature_name: "aura-photography" });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Aura analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    
    // Return full error structure if available
    if (errorData?.error) {
      return {
        success: false,
        error: {
          code: errorData.error.code || 'UNKNOWN_ERROR',
          message: errorData.error.message || 'Analysis failed',
          details: errorData.error.details || null
        }
      };
    }
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timeout. Please try again.',
          details: null
        }
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Image file is too large',
          details: null
        }
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid image format',
          details: null
        }
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: errorData?.message || 'Server error occurred',
          details: null
        }
      };
    } else if (!error.response) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
          details: null
        }
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: errorData?.message || error.message || 'Analysis failed',
        details: null
      }
    };
  }
};

/**
 * Gemstone Analysis API Service
 * Analyzes gemstone authenticity from an uploaded image
 * @param {File|Blob|string} imageData - Image file, blob, or base64 string
 * @param {AbortSignal} signal - Optional abort signal to cancel request
 * @returns {Promise} API response with analysis results
 */
export const analyzeGemstone = async (imageData, signal = null) => {
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
        signal, // Pass abort signal to axios
      }
    );

    trackEvent("shubh_ai_report_generated", { feature_name: "gemstone-authenticity" });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Gemstone analysis error:', error);
    
    // Extract error details from response
    const errorData = error.response?.data;
    
    // Return full error structure if available
    if (errorData?.error) {
      return {
        success: false,
        error: {
          code: errorData.error.code || 'UNKNOWN_ERROR',
          message: errorData.error.message || 'Analysis failed',
          details: errorData.error.details || null
        }
      };
    }
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timeout. Please try again.',
          details: null
        }
      };
    } else if (error.response?.status === 413) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Image file is too large',
          details: null
        }
      };
    } else if (error.response?.status === 415) {
      return {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid image format',
          details: null
        }
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: errorData?.message || 'Server error occurred',
          details: null
        }
      };
    } else if (!error.response) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
          details: null
        }
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: errorData?.message || error.message || 'Analysis failed',
        details: null
      }
    };
  }
};

/**
 * Talk to Kundli Chat API Services
 * AI-powered chat assistant based on user's birth chart
 */

/**
 * Start a new Kundli chat session
 * @param {Object} kundliData - Birth chart data
 * @returns {Promise} API response with session ID and welcome message
 */
export const startKundliChat = async (kundliData) => {
  try {
    const response = await privatePost(
      'companion-suite/kundli-chat/start',
      { kundliData }
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Start Kundli chat error:', error);
    
    const errorData = error.response?.data;
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Failed to start chat session'
    );
    
    return {
      success: false,
      error: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Send a message in Kundli chat session
 * @param {string} sessionId - Active session ID
 * @param {string} message - User's message
 * @returns {Promise} API response with AI's reply
 */
export const sendKundliChatMessage = async (sessionId, message) => {
  try {
    const response = await privatePost(
      'companion-suite/kundli-chat/message',
      { sessionId, message }
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Send Kundli chat message error:', error);
    
    const errorData = error.response?.data;
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Failed to send message'
    );
    
    return {
      success: false,
      error: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Karmic Debt Tracker API Service
 * Analyze karmic debt based on birth date numerology
 * @param {Object} data - Birth date information
 * @returns {Promise} API response with karmic analysis
 */
export const analyzeKarmicDebt = async (data) => {
  try {
    const response = await privatePost(
      'action-suite/karmic-debt/Analyze',
      data
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Karmic debt analysis error:', error);
    
    const errorData = error.response?.data;
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Failed to analyze karmic debt'
    );
    
    return {
      success: false,
      error: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Smart Matchmaking API Service
 * Analyze compatibility between two users based on kundli IDs
 * @param {string} kundliIdA - First user's kundli ID
 * @param {string} kundliIdB - Second user's kundli ID
 * @returns {Promise} API response with compatibility analysis
 */
export const analyzeSmartMatchmaking = async (kundliIdA, kundliIdB) => {
  try {
    const response = await privatePost(
      'action-suite/smart-matchmaking/smart-matchmaking',
      {
        kundliIdA,
        kundliIdB
      }
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Smart matchmaking error:', error);
    
    const errorData = error.response?.data;
    
    // Return full error structure if available
    if (errorData?.error) {
      return {
        success: false,
        error: {
          code: errorData.error.code || 'UNKNOWN_ERROR',
          message: errorData.error.message || 'Matchmaking analysis failed',
          details: errorData.error.details || null
        }
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: errorData?.message || error.message || 'Failed to analyze compatibility',
        details: null
      }
    };
  }
};

/**
 * Agentic Calendar API Service
 * Analyze events and get astrologically optimal timing recommendations
 * @param {Array<string>} events - List of events to analyze
 * @returns {Promise} API response with timing recommendations
 */
export const analyzeCalendarEvents = async (events, { fromDate, toDate, kundliId, lat, lng } = {}) => {
  try {
    const payload = { events };
    if (fromDate) payload.fromDate = fromDate;
    if (toDate) payload.toDate = toDate;
    if (kundliId) payload.kundliId = kundliId;
    if (lat != null && lng != null) {
      payload.lat = lat;
      payload.lon = lng;
    }

    const response = await privatePost(
      'companion-suite/agentic-calendar/analyze',
      payload
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Calendar analysis error:', error);
    
    const errorData = error.response?.data;
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Failed to analyze events'
    );
    
    return {
      success: false,
      error: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Dream Interpreter API Service
 * Interpret dreams with psychological and astrological insights
 * @param {Object} dreamData - Dream description and user context
 * @returns {Promise} API response with dream interpretation
 */
export const interpretDream = async (dreamData) => {
  try {
    const response = await privatePost(
      'companion-suite/dream-interpreter/interpret',
      dreamData
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Dream interpretation error:', error);
    
    const errorData = error.response?.data;
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Failed to interpret dream'
    );
    
    return {
      success: false,
      error: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Daily Cosmic Briefing API Service
 * Get personalized daily horoscope based on zodiac sign and birth details
 * @param {string} zodiacSign - User's zodiac sign (e.g., 'Taurus', 'Aries')
 * @param {Object} params - Birth details and location
 * @returns {Promise} API response with daily briefing
 */
export const getDailyCosmicBriefing = async (zodiacSign, params) => {
  try {
    const queryParams = new URLSearchParams({
      name: params.name,
      gender: params.gender,
      day: String(params.day),
      month: String(params.month),
      year: String(params.year),
      hour: String(params.hour),
      min: String(params.min),
      second: String(params.second),
      place: params.place,
      lat: String(params.lat),
      lon: String(params.lon),
      tzone: String(params.tzone),
      kundliId: params.kundliId
    }).toString();

    // skipToast: the caller handles failures (e.g. resolving the correct sign
    // and retrying), so suppress the global error toast for this request.
    const response = await privateGet(
      `companion-suite/daily-horoscope/${zodiacSign}?${queryParams}`,
      { skipToast: true }
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Daily cosmic briefing error:', error);
    
    const errorData = error.response?.data;
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Failed to fetch daily briefing'
    );
    
    return {
      success: false,
      error: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Cosmic Chat API Services
 * AI-powered cosmic guidance based on user's birth chart and planetary transits
 */

/**
 * Start a new Cosmic Chat session
 * @param {Object} kundliData - Birth chart data with cosmic details
 * @returns {Promise} API response with session ID and welcome message
 */
export const startCosmicChat = async (kundliData) => {
  try {
    const response = await privatePost(
      'wow-suite/cosmic-chat/session',
      { 
        userId: '',
        kundliData,
        isGuestSession: true
      }
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Start Cosmic chat error:', error);
    
    const errorData = error.response?.data;
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Failed to start cosmic chat session'
    );
    
    return {
      success: false,
      error: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Send a message in Cosmic Chat session
 * @param {string} sessionId - Active session ID
 * @param {string} message - User's message
 * @returns {Promise} API response with AI's cosmic guidance
 */
export const sendCosmicChatMessage = async (sessionId, message) => {
  try {
    const response = await privatePost(
      'wow-suite/cosmic-chat/message',
      { sessionId, message }
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Send Cosmic chat message error:', error);
    
    const errorData = error.response?.data;
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Failed to send message'
    );
    
    return {
      success: false,
      error: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * AstroVitals API Service
 * Sync health vitals with astrological insights
 * @param {Object} vitalsData - Health vitals and birth details
 * @returns {Promise} API response with health insights
 */
export const syncAstroVitals = async (vitalsData) => {
  try {
    const response = await privatePost(
      'action-suite/astro-vitals/data-sync',
      vitalsData
    );

    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('AstroVitals sync error:', error);
    
    const errorData = error.response?.data;
    const errorMessage = String(
      errorData?.error?.message || 
      errorData?.message || 
      error.message || 
      'Failed to sync vitals'
    );
    
    return {
      success: false,
      error: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR'
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


// ============================================================================
// GET RESULT APIs - Fetch stored analysis results from backend
// ============================================================================

/**
 * Get Palmistry Analysis Result by ID
 * @param {string} resultId - Result ID from analysis
 * @returns {Promise} API response with palmistry result
 */
export const getPalmistryResult = async (resultId) => {
  try {
    const response = await privateGet(`wow-suite/palmistry/result/${resultId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Get palmistry result error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch result',
    };
  }
};

/**
 * Get Face Reading Analysis Result by ID
 * @param {string} resultId - Result ID from analysis
 * @returns {Promise} API response with face reading result
 */
export const getFaceReadingResult = async (resultId) => {
  try {
    const response = await privateGet(`wow-suite/face-analysis/result/${resultId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Get face reading result error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch result',
    };
  }
};

/**
 * Get Signature Analysis Result by ID
 * @param {string} resultId - Result ID from analysis
 * @returns {Promise} API response with signature result
 */
export const getSignatureResult = async (resultId) => {
  try {
    const response = await privateGet(`wow-suite/signature/result/${resultId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Get signature result error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch result',
    };
  }
};

/**
 * Get Cloth Color Analysis Result by ID
 * @param {string} resultId - Result ID from analysis
 * @returns {Promise} API response with cloth color result
 */
export const getClothColorResult = async (resultId) => {
  try {
    const response = await privateGet(`wow-suite/clothes-color/result/${resultId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Get cloth color result error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch result',
    };
  }
};

/**
 * Get Aura Analysis Result by ID
 * @param {string} resultId - Result ID from analysis
 * @returns {Promise} API response with aura result
 */
export const getAuraResult = async (resultId) => {
  try {
    const response = await privateGet(`wow-suite/aura/result/${resultId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Get aura result error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch result',
    };
  }
};

/**
 * Get Gemstone Analysis Result by ID
 * @param {string} resultId - Result ID from analysis
 * @returns {Promise} API response with gemstone result
 */
export const getGemstoneResult = async (resultId) => {
  try {
    const response = await privateGet(`wow-suite/gemstone-scanner/result/${resultId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Get gemstone result error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch result',
    };
  }
};
