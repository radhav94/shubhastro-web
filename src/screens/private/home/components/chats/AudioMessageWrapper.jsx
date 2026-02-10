import { useEffect, useState } from 'react';
import VoiceMessage from '../../../../private/talkToAstrologer/voiceChat/VoiceMessage';

/**
 * Wrapper component for audio messages that fetches duration if not provided
 */
const AudioMessageWrapper = ({ url, duration, time, isSender }) => {
  const [audioDuration, setAudioDuration] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If duration is already provided and valid, use it
    if (duration && isFinite(duration) && duration > 0) {
      setAudioDuration(duration);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch it from the audio file
    if (!url) {
      setAudioDuration(null);
      setIsLoading(false);
      return;
    }

    const audio = new Audio();
    let durationCheckTimeout;
    let attemptCount = 0;
    const MAX_ATTEMPTS = 3;
    
    const checkDuration = (rawDuration) => {
      // Validate duration
      if (isFinite(rawDuration) && rawDuration > 0) {
        setAudioDuration(Math.floor(rawDuration));
        setIsLoading(false);
        return true;
      }
      return false;
    };

    const handleLoadedMetadata = () => {
      const rawDuration = audio.duration;
      
      if (checkDuration(rawDuration)) {
        return;
      }
      
      // If duration is invalid, try alternative method
      console.warn('Invalid audio duration on loadedmetadata:', rawDuration, 'for URL:', url);
      tryAlternativeMethod();
    };

    const tryAlternativeMethod = () => {
      if (attemptCount >= MAX_ATTEMPTS) {
        console.error('Failed to get valid duration after', MAX_ATTEMPTS, 'attempts');
        setAudioDuration(null); // Set to null to show "Unknown"
        setIsLoading(false);
        return;
      }

      attemptCount++;
      
      // Method 1: Try seeking to get duration
      audio.currentTime = 1e101; // Jump to end
      
      durationCheckTimeout = setTimeout(() => {
        const rawDuration = audio.duration;
        
        if (!checkDuration(rawDuration)) {
          // Method 2: Try playing briefly
          audio.play().then(() => {
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
              
              if (!checkDuration(audio.duration)) {
                // Still invalid, give up
                setAudioDuration(null);
                setIsLoading(false);
              }
            }, 100);
          }).catch(() => {
            setAudioDuration(null);
            setIsLoading(false);
          });
        }
      }, 300);
    };

    const handleError = (e) => {
      console.error('Error loading audio:', e, 'URL:', url);
      setAudioDuration(null);
      setIsLoading(false);
    };

    const handleDurationChange = () => {
      const rawDuration = audio.duration;
      checkDuration(rawDuration);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('error', handleError);
    
    // Set preload to metadata only
    audio.preload = 'metadata';
    audio.src = url;
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('error', handleError);
      if (durationCheckTimeout) {
        clearTimeout(durationCheckTimeout);
      }
      audio.pause();
      audio.src = '';
    };
  }, [url, duration]);

  // Display duration: use fetched value, or show "?" if unknown
  const displayDuration = audioDuration !== null ? audioDuration : 0;

  return (
    <VoiceMessage
      url={url}
      duration={displayDuration}
      time={time}
      isSender={isSender}
      isLoading={isLoading}
    />
  );
};

export default AudioMessageWrapper;
