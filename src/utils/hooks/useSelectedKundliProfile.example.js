/**
 * USAGE EXAMPLES FOR useSelectedKundliProfile HOOK
 * 
 * This file demonstrates various ways to use the useSelectedKundliProfile hook
 * in AIWow modules and other components that need Kundli profile data.
 */

import { useEffect } from 'react';
import useSelectedKundliProfile from './useSelectedKundliProfile';

// ============================================================================
// EXAMPLE 1: Basic Usage (Required Profile)
// ============================================================================
// Use this when the component MUST have a profile to function
// Will automatically redirect to AIWow page if no profile is found

function BasicExample() {
  const { profile, isLoading, error } = useSelectedKundliProfile();

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Welcome, {profile.name}</h1>
      <p>Profile ID: {profile._id}</p>
      {/* Use profile data for API calls */}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Optional Profile (No Redirect)
// ============================================================================
// Use this when profile is optional and you want to handle missing profile yourself

function OptionalProfileExample() {
  const { profile, isLoading, error } = useSelectedKundliProfile({
    required: false,
    showToast: false,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {profile ? (
        <div>
          <h1>Profile: {profile.name}</h1>
          <p>Birth Date: {profile.birthDate}</p>
        </div>
      ) : (
        <div>
          <p>No profile selected</p>
          <button onClick={() => window.location.href = '/aiwow'}>
            Select Profile
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: With Custom Redirect Path
// ============================================================================
// Use this when you want to redirect to a specific page instead of AIWow

function CustomRedirectExample() {
  const { profile, isLoading } = useSelectedKundliProfile({
    required: true,
    redirectPath: '/kundli',
    showToast: true,
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>Profile: {profile.name}</div>;
}

// ============================================================================
// EXAMPLE 4: With Manual Refresh
// ============================================================================
// Use this when you need to manually refresh the profile (e.g., after update)

function RefreshExample() {
  const { profile, isLoading, refreshProfile } = useSelectedKundliProfile();

  const handleUpdateProfile = async () => {
    // Update profile via API
    await updateProfileAPI(profile._id, { name: 'New Name' });
    
    // Refresh to get latest data
    refreshProfile();
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile.name}</h1>
      <button onClick={handleUpdateProfile}>Update Profile</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: AIWow Module with API Call
// ============================================================================
// Real-world example: Using profile data for API calls in AIWow modules

function AuraAnalysisExample() {
  const { profile, isLoading, error } = useSelectedKundliProfile();

  useEffect(() => {
    if (profile && !isLoading) {
      // Now safe to make API call with profile data
      analyzeAuraAPI({
        profileId: profile._id,
        name: profile.name,
        birthDate: profile.birthDate,
        // ... other profile fields
      });
    }
  }, [profile, isLoading]);

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    // Error is already handled by hook (toast + redirect)
    // This is just a fallback
    return null;
  }

  return (
    <div>
      <h1>Analyzing Aura for {profile.name}</h1>
      {/* Rest of component */}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: With Clear Profile Function
// ============================================================================
// Use this when you need to clear the profile (e.g., logout, switch user)

function ClearProfileExample() {
  const { profile, clearProfile } = useSelectedKundliProfile({
    required: false,
  });

  const handleLogout = () => {
    clearProfile(); // Clear profile from store and localStorage
    // Perform other logout actions
  };

  return (
    <div>
      {profile && (
        <>
          <h1>{profile.name}</h1>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Disable Auto-validation on Mount
// ============================================================================
// Use this when you want to manually control when to load the profile

function ManualValidationExample() {
  const { profile, isLoading, refreshProfile } = useSelectedKundliProfile({
    validateOnMount: false, // Don't load on mount
  });

  const handleLoadProfile = () => {
    refreshProfile(); // Manually trigger profile load
  };

  return (
    <div>
      <button onClick={handleLoadProfile}>Load Profile</button>
      {isLoading && <div>Loading...</div>}
      {profile && <div>Profile: {profile.name}</div>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Complete AIWow Module Pattern
// ============================================================================
// Full example showing best practices for AIWow modules

function CompleteAIWowModuleExample() {
  const { profile, isLoading, error } = useSelectedKundliProfile();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const performAnalysis = async () => {
    if (!profile) {
      Toast.error('Profile not available');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeAPI({
        profileId: profile._id,
        name: profile.name,
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        birthPlace: profile.birthPlace,
      });

      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis failed:', err);
      Toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Show loading state while profile is being loaded
  if (isLoading) {
    return <PrimaryLoader isLoading={true} />;
  }

  // Error state (though hook handles redirect, this is a fallback)
  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => window.location.href = '/aiwow'}>
          Go to AIWow
        </button>
      </div>
    );
  }

  // Main component render
  return (
    <div className={styles.container}>
      <div className={styles.profileInfo}>
        <h2>{profile.name}</h2>
        <p>{profile.birthDate}</p>
      </div>

      <button 
        onClick={performAnalysis}
        disabled={analyzing || !profile}
      >
        {analyzing ? 'Analyzing...' : 'Start Analysis'}
      </button>

      {analysisResult && (
        <div className={styles.result}>
          {/* Display results */}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HOOK OPTIONS REFERENCE
// ============================================================================
/*
useSelectedKundliProfile(options)

OPTIONS:
{
  required: boolean          // Default: true
    - If true, redirects to AIWow page when profile is missing
    - If false, allows component to render without profile

  showToast: boolean         // Default: true
    - If true, shows toast notification on error
    - If false, silently handles errors

  redirectPath: string       // Default: '/aiwow'
    - Custom path to redirect when profile is missing
    - Only used when required=true

  validateOnMount: boolean   // Default: true
    - If true, validates and loads profile on component mount
    - If false, you must manually call refreshProfile()
}

RETURNS:
{
  profile: object | null     // The selected Kundli profile
  isLoading: boolean         // True while loading profile
  error: string | null       // Error message if any
  refreshProfile: function   // Manually reload profile
  clearProfile: function     // Clear profile from store and localStorage
}
*/
