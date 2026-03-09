import { useRouteError, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './ErrorBoundary.module.scss';

/**
 * Route Error Boundary for React Router v7
 * Catches errors during route loading, rendering, and data fetching
 */
const RouteErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error('🔴 Route Error:', error);

  // Handle chunk loading errors with auto-reload
  useEffect(() => {
    const isChunkError = 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('error loading dynamically imported module') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      console.error('Chunk loading error detected in route, attempting reload...');
      
      const hasReloaded = sessionStorage.getItem('route-chunk-error-reload');
      if (!hasReloaded) {
        sessionStorage.setItem('route-chunk-error-reload', 'true');
        // Auto-reload after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        // Already tried reloading, clear flag and show error
        sessionStorage.removeItem('route-chunk-error-reload');
      }
    }
  }, [error]);

  const handleReload = () => {
    sessionStorage.removeItem('route-chunk-error-reload');
    window.location.reload();
  };

  const handleGoHome = () => {
    sessionStorage.removeItem('route-chunk-error-reload');
    navigate('/', { replace: true });
  };

  // Determine error type and message
  let errorTitle = 'Something went wrong';
  let errorMessage = 'An unexpected error occurred while loading this page.';
  let showDetails = false;

  // Check for chunk loading errors
  const isChunkError = 
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Importing a module script failed') ||
    error?.message?.includes('error loading dynamically imported module') ||
    error?.name === 'ChunkLoadError';

  if (isChunkError) {
    errorTitle = 'Loading Issue';
    errorMessage = 'Failed to load page resources. This might be due to a network issue or outdated cache. The page will reload automatically.';
  } else if (error?.status === 404) {
    errorTitle = 'Page Not Found';
    errorMessage = 'The page you are looking for does not exist.';
  } else if (error?.status === 403) {
    errorTitle = 'Access Denied';
    errorMessage = 'You do not have permission to access this page.';
  } else if (error?.status === 500) {
    errorTitle = 'Server Error';
    errorMessage = 'A server error occurred. Please try again later.';
  } else if (error?.message) {
    showDetails = true;
  }

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        {/* Mystical Icon */}
        <div className={styles.iconWrapper}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={styles.errorIcon}>
            <circle cx="60" cy="60" r="55" stroke="#ffcb03" strokeWidth="3" fill="none" opacity="0.3"/>
            <circle cx="60" cy="60" r="45" stroke="#ffcb03" strokeWidth="2" fill="none" opacity="0.5"/>
            <path d="M60 20L65 45L85 50L65 55L60 80L55 55L35 50L55 45L60 20Z" fill="#ffcb03"/>
            <circle cx="60" cy="60" r="8" fill="#BB1160"/>
            <path d="M40 60C40 48.954 48.954 40 60 40" stroke="#BB1160" strokeWidth="3" strokeLinecap="round"/>
            <path d="M80 60C80 71.046 71.046 80 60 80" stroke="#BB1160" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <div className={styles.sparkles}>
            <span className={styles.sparkle} style={{ top: '10%', left: '20%' }}>✨</span>
            <span className={styles.sparkle} style={{ top: '15%', right: '25%' }}>⭐</span>
            <span className={styles.sparkle} style={{ bottom: '20%', left: '15%' }}>💫</span>
            <span className={styles.sparkle} style={{ bottom: '15%', right: '20%' }}>✨</span>
          </div>
        </div>

        {/* Error Message */}
        <h1 className={styles.errorTitle}>{errorTitle}</h1>
        <p className={styles.errorSubtitle}>{errorMessage}</p>

        <div className={styles.errorDetails}>
          <div className={styles.detailCard}>
            <span className={styles.detailIcon}>🔮</span>
            <div className={styles.detailText}>
              <h3>What happened?</h3>
              <p>
                {error?.status === 404 
                  ? 'The cosmic path you seek does not exist in our realm.'
                  : 'An unexpected disruption occurred in the cosmic flow. Our engineers have been notified.'}
              </p>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && showDetails && (
            <div className={styles.devInfo}>
              <details className={styles.errorAccordion}>
                <summary className={styles.accordionHeader}>
                  <span className={styles.devIcon}>🐛</span>
                  Developer Info (Development Mode)
                </summary>
                <div className={styles.accordionContent}>
                  <div className={styles.errorBlock}>
                    <strong>Error:</strong>
                    <pre className={styles.errorText}>{error?.message || 'Unknown error'}</pre>
                  </div>
                  {error?.stack && (
                    <div className={styles.errorBlock}>
                      <strong>Stack Trace:</strong>
                      <pre className={styles.errorText}>{error.stack}</pre>
                    </div>
                  )}
                  {error?.status && (
                    <div className={styles.errorBlock}>
                      <strong>Status Code:</strong>
                      <pre className={styles.errorText}>{error.status}</pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button className={styles.primaryBtn} onClick={handleReload}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C12.0711 2.5 13.9461 3.35714 15.3033 4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M15 2.5V5H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Try Again
          </button>
          <button className={styles.secondaryBtn} onClick={handleGoHome}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2.5 7.5L10 2.5L17.5 7.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.5 17.5V10H12.5V17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Return Home
          </button>
        </div>

        {/* Mystical Quote */}
        <div className={styles.quote}>
          <span className={styles.quoteIcon}>☾</span>
          <p className={styles.quoteText}>
            "Even the cosmos experiences turbulence. Patience brings clarity."
          </p>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
