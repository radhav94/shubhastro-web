import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSelectedKundliProfile } from '../../redux/aiwow/aiwowSlice';
import { PATH } from '../routes/Paths';
import { Toast } from '../../component';

/**
 * Custom hook to manage selected Kundli profile with localStorage persistence
 * Handles profile retrieval from Redux store or localStorage with proper error handling
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - If true, redirects to AIWow page when profile is missing (default: true)
 * @param {boolean} options.showToast - If true, shows toast notification on error (default: true)
 * @param {string} options.redirectPath - Custom redirect path when profile is missing (default: AIWow page)
 * @param {boolean} options.validateOnMount - If true, validates profile on component mount (default: true)
 * 
 * @returns {Object} - { profile, isLoading, error, refreshProfile, clearProfile }
 */
const useSelectedKundliProfile = (options = {}) => {
  const {
    required = true,
    showToast = true,
    redirectPath = PATH.privateRoutes.AIWOW?.path || '/aiwow',
    validateOnMount = true,
  } = options;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get profile from Redux store
  const profileFromStore = useSelector((state) => state.aiwow?.selectedKundliProfile);
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Validates if a profile object has required fields
   */
  const validateProfile = useCallback((profileData) => {
    if (!profileData || typeof profileData !== 'object') {
      return { valid: false, error: 'Invalid profile data format' };
    }

    // Check for required fields
    const requiredFields = ['_id', 'name'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    if (missingFields.length > 0) {
      return { 
        valid: false, 
        error: `Profile missing required fields: ${missingFields.join(', ')}` 
      };
    }

    return { valid: true, error: null };
  }, []);

  /**
   * Retrieves profile from localStorage
   */
  const getProfileFromLocalStorage = useCallback(() => {
    try {
      const storedProfile = localStorage.getItem('selectedKundliProfile');
      
      if (!storedProfile) {
        return { profile: null, error: 'No profile found in localStorage' };
      }

      const parsed = JSON.parse(storedProfile);
      const validation = validateProfile(parsed);
      
      if (!validation.valid) {
        console.error('Invalid profile in localStorage:', validation.error);
        // Clear invalid data
        localStorage.removeItem('selectedKundliProfile');
        return { profile: null, error: validation.error };
      }

      return { profile: parsed, error: null };
    } catch (err) {
      console.error('Error parsing profile from localStorage:', err);
      // Clear corrupted data
      localStorage.removeItem('selectedKundliProfile');
      return { profile: null, error: 'Failed to parse stored profile' };
    }
  }, [validateProfile]);

  /**
   * Saves profile to localStorage
   */
  const saveProfileToLocalStorage = useCallback((profileData) => {
    try {
      if (!profileData) {
        localStorage.removeItem('selectedKundliProfile');
        return;
      }

      const validation = validateProfile(profileData);
      if (!validation.valid) {
        console.error('Cannot save invalid profile:', validation.error);
        return;
      }

      localStorage.setItem('selectedKundliProfile', JSON.stringify(profileData));
    } catch (err) {
      console.error('Error saving profile to localStorage:', err);
    }
  }, [validateProfile]);

  /**
   * Loads profile from store or localStorage
   */
  const loadProfile = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      // First, try to get from Redux store
      if (profileFromStore) {
        const validation = validateProfile(profileFromStore);
        
        if (validation.valid) {
          setProfile(profileFromStore);
          saveProfileToLocalStorage(profileFromStore);
          setIsLoading(false);
          return;
        } else {
          console.warn('Invalid profile in Redux store:', validation.error);
        }
      }

      // If not in store, try localStorage
      const { profile: storedProfile, error: storageError } = getProfileFromLocalStorage();
      
      if (storedProfile) {
        // Restore to Redux store
        dispatch(setSelectedKundliProfile(storedProfile));
        setProfile(storedProfile);
        setIsLoading(false);
        return;
      }

      // No profile found anywhere
      const errorMsg = storageError || 'No Kundli profile selected';
      setError(errorMsg);
      
      if (required) {
        if (showToast) {
          Toast.error('Please select a Kundli profile to continue');
        }
        
        // Redirect to AIWow page to select profile
        console.warn('No profile found, redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      const errorMsg = 'Failed to load Kundli profile';
      setError(errorMsg);
      
      if (showToast) {
        Toast.error(errorMsg);
      }
      
      if (required) {
        navigate(redirectPath, { replace: true });
      }
      
      setIsLoading(false);
    }
  }, [
    profileFromStore,
    validateProfile,
    getProfileFromLocalStorage,
    saveProfileToLocalStorage,
    dispatch,
    navigate,
    required,
    showToast,
    redirectPath,
  ]);

  /**
   * Manually refresh/reload the profile
   */
  const refreshProfile = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * Clear profile from store and localStorage
   */
  const clearProfile = useCallback(() => {
    setProfile(null);
    setError(null);
    localStorage.removeItem('selectedKundliProfile');
    dispatch(setSelectedKundliProfile(null));
  }, [dispatch]);

  // Load profile on mount or when profileFromStore changes
  useEffect(() => {
    if (validateOnMount) {
      loadProfile();
    }
  }, [validateOnMount, loadProfile]);

  // Sync with Redux store changes
  useEffect(() => {
    if (profileFromStore) {
      const validation = validateProfile(profileFromStore);
      if (validation.valid) {
        setProfile(profileFromStore);
        saveProfileToLocalStorage(profileFromStore);
      }
    }
  }, [profileFromStore, validateProfile, saveProfileToLocalStorage]);

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
    clearProfile,
  };
};

export default useSelectedKundliProfile;
