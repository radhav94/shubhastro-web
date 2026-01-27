import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SmartMatchmaking.module.scss';
import { Toast } from '../../../../component';
import { completeMatchmakingProfile } from '../../../../services/appServices/aiWowService';

const SmartMatchmaking = () => {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: 'Male',
    city: '',
    state: '',
    country: 'India',
    education: '',
    profession: '',
    bio: '',
    hobbies: '',
    values: '',
    minAge: '',
    maxAge: '',
    preferredLocations: '',
    educationPreference: ''
  });

  useEffect(() => {
    const profileData = localStorage.getItem('selectedKundliProfile');
    if (!profileData) {
      Toast.error('Please select a kundli profile first');
      navigate('/aiwow', { replace: true });
      return;
    }

    try {
      const profile = JSON.parse(profileData);
      setSelectedProfile(profile);
      
      // Pre-fill name from profile
      setFormData(prev => ({
        ...prev,
        fullName: profile.name || ''
      }));
    } catch (error) {
      console.error('Invalid profile data:', error);
      Toast.error('Invalid profile data. Please select again.');
      localStorage.removeItem('selectedKundliProfile');
      navigate('/aiwow', { replace: true });
    }
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      Toast.error('Please enter your full name');
      return;
    }
    if (!formData.age || formData.age < 18 || formData.age > 100) {
      Toast.error('Please enter a valid age (18-100)');
      return;
    }
    if (!formData.city.trim()) {
      Toast.error('Please enter your city');
      return;
    }

    try {
      setIsLoading(true);

      const profileData = {
        basicInfo: {
          fullName: formData.fullName.trim(),
          age: parseInt(formData.age),
          gender: formData.gender,
          location: {
            city: formData.city.trim(),
            state: formData.state.trim() || 'Unknown',
            country: formData.country
          },
          education: formData.education.trim() || 'Not specified',
          profession: formData.profession.trim() || 'Not specified',
          bio: formData.bio.trim() || 'Looking for a meaningful relationship.'
        },
        interests: {
          hobbies: formData.hobbies.trim() 
            ? formData.hobbies.split(',').map(h => h.trim()).filter(h => h)
            : [],
          values: formData.values.trim()
            ? formData.values.split(',').map(v => v.trim()).filter(v => v)
            : []
        },
        preferences: {
          ageRange: {
            min: formData.minAge ? parseInt(formData.minAge) : parseInt(formData.age) - 5,
            max: formData.maxAge ? parseInt(formData.maxAge) : parseInt(formData.age) + 5
          },
          preferredLocations: formData.preferredLocations.trim()
            ? formData.preferredLocations.split(',').map(l => l.trim()).filter(l => l)
            : [formData.city.trim()],
          educationPreference: formData.educationPreference.trim() || 'Any'
        }
      };

      const apiResult = await completeMatchmakingProfile(profileData);

      if (apiResult.success) {
        setResult(apiResult.data);
      }
    } catch (error) {
      console.error('Failed to complete profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
    } else {
      localStorage.removeItem('selectedKundliProfile');
      navigate(-1);
    }
  };

  const handleNewProfile = () => {
    setResult(null);
    setFormData({
      fullName: selectedProfile?.name || '',
      age: '',
      gender: 'Male',
      city: '',
      state: '',
      country: 'India',
      education: '',
      profession: '',
      bio: '',
      hobbies: '',
      values: '',
      minAge: '',
      maxAge: '',
      preferredLocations: '',
      educationPreference: ''
    });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Smart Matchmaking</h1>
          {selectedProfile && (
            <p className={styles.subtitle}>{selectedProfile.name}</p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {!result ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.introSection}>
              <div className={styles.introIcon}>💕</div>
              <h2 className={styles.introTitle}>Find Your Perfect Match</h2>
              <p className={styles.introText}>
                Complete your profile to get AI-powered compatibility insights
              </p>
            </div>

            {/* Basic Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Full Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Age <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="25"
                    min="18"
                    max="100"
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Gender <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.select}
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    City <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Mumbai"
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>State</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Maharashtra"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Education</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    placeholder="Graduate, Post Graduate, etc."
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Profession</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.profession}
                    onChange={(e) => handleInputChange('profession', e.target.value)}
                    placeholder="Software Engineer"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Bio</label>
                <textarea
                  className={styles.textarea}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Interests */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Interests & Values</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Hobbies</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.hobbies}
                  onChange={(e) => handleInputChange('hobbies', e.target.value)}
                  placeholder="Reading, Travel, Music (comma separated)"
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Values</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.values}
                  onChange={(e) => handleInputChange('values', e.target.value)}
                  placeholder="Family, Career, Honesty (comma separated)"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Preferences */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Partner Preferences</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Min Age</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.minAge}
                    onChange={(e) => handleInputChange('minAge', e.target.value)}
                    placeholder="24"
                    min="18"
                    max="100"
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Age</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.maxAge}
                    onChange={(e) => handleInputChange('maxAge', e.target.value)}
                    placeholder="32"
                    min="18"
                    max="100"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Preferred Locations</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.preferredLocations}
                  onChange={(e) => handleInputChange('preferredLocations', e.target.value)}
                  placeholder="Mumbai, Pune (comma separated)"
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Education Preference</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.educationPreference}
                  onChange={(e) => handleInputChange('educationPreference', e.target.value)}
                  placeholder="Graduate, Post Graduate, Any"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Creating Profile...
                </>
              ) : (
                'Complete Profile'
              )}
            </button>
          </form>
        ) : (
          <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
              <div className={styles.resultIcon}>✨</div>
              <h2 className={styles.resultTitle}>
                {result.message || 'Profile Created Successfully!'}
              </h2>
              {result.matchCount && (
                <p className={styles.matchCount}>
                  {result.matchCount} {result.matchCount === 1 ? 'Match' : 'Matches'} Found
                </p>
              )}
            </div>

            {/* Profile Info */}
            {result.profileId && (
              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Profile ID:</span>
                  <span className={styles.infoValue}>{result.profileId}</span>
                </div>
                {result.completionPercentage && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Completion:</span>
                    <span className={styles.infoValue}>{result.completionPercentage}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Match Suggestions */}
            {result.matches && result.matches.length > 0 && (
              <div className={styles.matchesSection}>
                <h3 className={styles.matchesTitle}>Your Match Suggestions</h3>
                <div className={styles.matchesList}>
                  {result.matches.map((match, index) => (
                    <div key={match.matchId || index} className={styles.matchCard}>
                      {/* Match Header */}
                      <div className={styles.matchHeader}>
                        <div className={styles.matchAvatar}>
                          {match.profile?.basicInfo?.fullName?.charAt(0) || '?'}
                        </div>
                        <div className={styles.matchInfo}>
                          <h4 className={styles.matchName}>
                            {match.profile?.basicInfo?.fullName || 'Unknown'}
                          </h4>
                          <p className={styles.matchDetails}>
                            {match.profile?.basicInfo?.age && `${match.profile.basicInfo.age} years`}
                            {match.profile?.basicInfo?.profession && ` • ${match.profile.basicInfo.profession}`}
                          </p>
                          {match.profile?.basicInfo?.location?.city && (
                            <p className={styles.matchLocation}>
                              📍 {match.profile.basicInfo.location.city}
                            </p>
                          )}
                        </div>
                        {match.matchScore && (
                          <div className={styles.matchScoreBadge}>
                            {match.matchScore}%
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      {match.profile?.basicInfo?.bio && (
                        <p className={styles.matchBio}>{match.profile.basicInfo.bio}</p>
                      )}

                      {/* Match Score Breakdown */}
                      {match.matchScoreBreakdown && (
                        <div className={styles.scoreBreakdown}>
                          <h5 className={styles.breakdownTitle}>Compatibility Breakdown</h5>
                          <div className={styles.scoreGrid}>
                            {Object.entries(match.matchScoreBreakdown).map(([key, value]) => (
                              key !== 'overall' && (
                                <div key={key} className={styles.scoreItem}>
                                  <span className={styles.scoreLabel}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                  </span>
                                  <div className={styles.scoreBar}>
                                    <div 
                                      className={styles.scoreBarFill}
                                      style={{ width: `${value}%` }}
                                    ></div>
                                  </div>
                                  <span className={styles.scoreValue}>{value}%</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Compatibility */}
                      {match.compatibility && (
                        <div className={styles.compatibility}>
                          {match.compatibility.strengths && match.compatibility.strengths.length > 0 && (
                            <div className={styles.compatibilitySection}>
                              <h5 className={styles.compatibilityTitle}>💚 Strengths</h5>
                              <ul className={styles.compatibilityList}>
                                {match.compatibility.strengths.map((strength, idx) => (
                                  <li key={idx}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {match.compatibility.challenges && match.compatibility.challenges.length > 0 && (
                            <div className={styles.compatibilitySection}>
                              <h5 className={styles.compatibilityTitle}>⚠️ Challenges</h5>
                              <ul className={styles.compatibilityList}>
                                {match.compatibility.challenges.map((challenge, idx) => (
                                  <li key={idx}>{challenge}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Summary */}
                      {match.summary && (
                        <div className={styles.matchSummary}>
                          <p>{match.summary}</p>
                        </div>
                      )}

                      {/* Interests */}
                      {match.profile?.interests && (
                        <div className={styles.interests}>
                          {match.profile.interests.hobbies && match.profile.interests.hobbies.length > 0 && (
                            <div className={styles.interestGroup}>
                              <span className={styles.interestLabel}>Hobbies:</span>
                              <div className={styles.interestTags}>
                                {match.profile.interests.hobbies.slice(0, 4).map((hobby, idx) => (
                                  <span key={idx} className={styles.interestTag}>{hobby}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {match.profile.interests.values && match.profile.interests.values.length > 0 && (
                            <div className={styles.interestGroup}>
                              <span className={styles.interestLabel}>Values:</span>
                              <div className={styles.interestTags}>
                                {match.profile.interests.values.slice(0, 4).map((value, idx) => (
                                  <span key={idx} className={styles.interestTag}>{value}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className={styles.newProfileButton} onClick={handleNewProfile}>
              Create Another Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartMatchmaking;
