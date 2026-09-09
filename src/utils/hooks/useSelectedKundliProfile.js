import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSelectedKundliProfile } from '../../redux/aiwow/aiwowSlice';
import { useGetAllKundlisQuery } from '../../services/appServices/kundliServicesNew';
import { PATH } from '../routes/Paths';
import { Toast } from '../../component';

/**
 * Custom hook to manage selected Kundli profile with localStorage persistence
 * Handles profile retrieval from Redux store or localStorage with proper error handling
 * Syncs with header's selected Kundli (state.kundli.selectedKundli) as top priority
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
    redirectPath = PATH.privateRoutes.AI_WOW?.path || '/ai-wow',
    validateOnMount = true,
  } = options;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get profile from Redux store (aiwow slice)
  const profileFromStore = useSelector((state) => state.aiwow?.selectedKundliProfile);
  // Get profile selected from header (kundli slice) — this takes priority
  const headerSelectedKundli = useSelector((state) => state.kundli?.selectedKundli);
  const token = useSelector((state) => state.auth?.token);

  /*
   * The `auth` slice is NOT in the redux-persist whitelist (store.js persists
   * only kundli, calculator and form), so `state.auth.token` is undefined on
   * every fresh page load until something repopulates it. Skipping on the Redux
   * token alone therefore meant the API fallback below — the branch commented
   * "No profile found in store or localStorage — try fetching from API" — never
   * ran on a reload or a deep link, which is precisely when the Redux store is
   * empty and the fallback is the only thing that could help.
   *
   * A skipped RTK Query also reports `isLoading: false`, so the
   * `if (profilesQueryLoading) return` guard further down did not hold it back
   * either: the hook went straight to "No Kundli profile selected", toasted, and
   * redirected a user who has profiles on the server and simply had no
   * localStorage mirror (which the guest-login path deliberately removes).
   *
   * Reading the same localStorage keys the profile lookup below already trusts
   * keeps the two consistent.
   */
  const hasAuthToken = !!(
    token ||
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("shubhtalk_customer_token") ||
        localStorage.getItem("shubhtalk_astro_token")))
  );

  // Fetch all profiles as fallback when no profile is explicitly selected
  const { data: allProfilesData, isLoading: profilesQueryLoading } = useGetAllKundlisQuery(undefined, {
    skip: !hasAuthToken,
  });
  
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
    // Wait for profiles query to finish before concluding no profile exists
    if (profilesQueryLoading) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Top priority: header's selected Kundli (state.kundli.selectedKundli)
      if (headerSelectedKundli) {
        const validation = validateProfile(headerSelectedKundli);
        
        if (validation.valid) {
          // Sync header selection to aiwow slice and localStorage
          dispatch(setSelectedKundliProfile(headerSelectedKundli));
          saveProfileToLocalStorage(headerSelectedKundli);
          setProfile(headerSelectedKundli);
          setIsLoading(false);
          return;
        }
      }

      // Second: try aiwow Redux store
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

      // If not in store, try localStorage (only for logged-in users)
      const userToken = localStorage.getItem("shubhtalk_customer_token") || localStorage.getItem("shubhtalk_astro_token");
      const { profile: storedProfile, error: storageError } = userToken ? getProfileFromLocalStorage() : { profile: null, error: null };
      
      if (storedProfile) {
        // Restore to Redux store
        dispatch(setSelectedKundliProfile(storedProfile));
        setProfile(storedProfile);
        setIsLoading(false);
        return;
      }

      // No profile found in store or localStorage — try fetching from API
      // Prefer "Self" relation profile, fallback to first profile
      const allProfiles = allProfilesData?.data || [];
      if (allProfiles.length > 0) {
        const fallbackProfile = allProfiles.find(
          (p) => p.relation?.toLowerCase() === 'self'
        ) || allProfiles[0];

        const fallbackValidation = validateProfile(fallbackProfile);
        if (fallbackValidation.valid) {
          dispatch(setSelectedKundliProfile(fallbackProfile));
          setProfile(fallbackProfile);
          saveProfileToLocalStorage(fallbackProfile);
          setIsLoading(false);
          return;
        }
      }

      // Still no profile found
      const errorMsg = storageError || 'No Kundli profile selected';
      setError(errorMsg);

      if (required) {
        if (showToast) {
          /*
            Two different situations were being reported with one sentence.

            An authenticated visitor with no profile selected genuinely can "select
            a Kundli profile". A GUEST cannot: they have no profiles, no selector,
            and the query that would list them was skipped (see hasAuthToken), so
            telling them to select one describes an action that does not exist for
            them. Say which case it is.
          */
          Toast.error(
            hasAuthToken
              ? 'Please select a Kundli profile to continue'
              : 'Add your birth details to use this feature'
          );
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
    headerSelectedKundli,
    allProfilesData,
    profilesQueryLoading,
    validateProfile,
    getProfileFromLocalStorage,
    saveProfileToLocalStorage,
    dispatch,
    navigate,
    required,
    showToast,
    redirectPath,
    // Read by the guest-vs-signed-in branch of the "no profile" message. Listed
    // so that branch cannot pick a stale value from an earlier render — it is
    // recomputed each render from the auth token and localStorage.
    hasAuthToken,
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
    /*
      True when the visitor is not signed in at all, so a kundli profile is not
      merely unselected but impossible.

      Why this exists, and the sequencing that still has to happen
      -----------------------------------------------------------
      With `required: true` a guest is bounced on mount: hasAuthToken is false, so
      useGetAllKundlisQuery is SKIPPED, which reports isLoading:false, and the
      localStorage lookup is gated on the same token — so the guest falls straight
      through to the toast + navigate(redirectPath, { replace: true }) above,
      before anything renders.

      Most consumers point redirectPath at /ai-wow, which is a menu of tools that
      will each bounce them again. Clarity session je5byb is that loop measured:
      a guest from Facebook, 10 page views from 8 clicks (more pages than clicks
      is only possible if navigation happened without one), 54 seconds, gone.
      The only explanation offered is a toast — top-right, off-screen in a
      Facebook WebView, and invisible to session replay.

      DreamInterpreter and BusinessPathfinder already avoid this by passing
      `required: !isGuest` / `required: false` and handling the guest themselves,
      which is the correct shape.

      CORRECTION to an earlier note here, which named the five *Analysis screens as
      the bounce points. They are not: none of them is reachable in one tap from
      the /ai-wow menu — each sits behind a capture-or-upload step — so a guest is
      stopped long before them. Every consumer was audited; the actual behaviour
      for a guest is:

        - TalkToKundliChat  — already correct (`required: hasToken` +
                              GuestKundliAuthModal).
        - AgenticCalendar, BusinessPathfinder, DreamInterpreter — already correct
                              (`required: false` / `!isGuest`).
        - CosmicChat, DailyCosmicBriefing — not this loop: both do a hard
                              `window.location.href = "/login?skip=welcome"` for a
                              guest, so they land on login, not back on /ai-wow.
        - AstroVitals, KarmicDebtTracker — THESE were the loop. Bare
                              `useSelectedKundliProfile()` (so `required: true`),
                              no guest handling at all, one tap from the menu.
                              Both now pass `required: !isGuest` and open
                              GuestKundliAuthModal from their submit handler.
        - ClothColorForm, and the six *Analysis screens — still unconditional
                              `required: true`. Left that way deliberately: they
                              are mid-flow screens, so a guest reaching one has
                              already been through a step that handles guests
                              itself, and giving them a second guest modal here
                              would be a redundant path with no session behind it.

      DO NOT flip a consumer to `required: false` without also giving it a way to
      get a profile. All the *Analysis screens guard `!profile` (3-6 guards each) so
      they would not crash, but a guest would simply sit on a screen that can never
      proceed — a permanently inert Generate button is worse than a redirect. Both
      screens converted above pass that test because their analysis is behind an
      explicit submit, never an auto-run effect, and both mount a
      GuestKundliAuthModal. That is the same shape PalmistryCamera, AuraCamera and
      PanditAIBubble already use.

      `needsAuth` is exported for consumers that want to make this decision from
      the hook rather than re-reading localStorage; the two converted screens read
      the token directly instead, because they need it before the hook's options
      are built.
    */
    needsAuth: !hasAuthToken,
    refreshProfile,
    clearProfile,
  };
};

export default useSelectedKundliProfile;
