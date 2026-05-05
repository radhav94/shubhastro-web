import React from 'react';
import styles from './ErrorBoundary.module.scss';
import NoInternet from './NoInternet/NoInternet';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // If offline, don't set hasError — let NoInternet handle it
    if (!navigator.onLine) {
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // If offline, ignore the error — it's likely caused by failed network requests
    if (!navigator.onLine) {
      return;
    }

    console.error('🔴 ErrorBoundary caught an error:', {
      error: error,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  componentDidMount() {
    // Reset error state when coming back online
    window.addEventListener('online', this.handleOnline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
  }

  handleOnline = () => {
    if (this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    // If offline — ignore errors, render children normally
    // HomeLayout will show NoInternet component with header/footer
    if (!navigator.onLine) {
      return this.props.children;
    }

    if (this.state.hasError) {
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
            <h1 className={styles.errorTitle}>Cosmic Disruption Detected</h1>
            <p className={styles.errorSubtitle}>
              The stars have misaligned, causing a temporary disturbance in the cosmic flow.
            </p>

            <div className={styles.errorDetails}>
              <div className={styles.detailCard}>
                <span className={styles.detailIcon}>🔮</span>
                <div className={styles.detailText}>
                  <h3>What happened?</h3>
                  <p>An unexpected error occurred while processing your request. Our cosmic engineers have been notified.</p>
                </div>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className={styles.devInfo}>
                  <details className={styles.errorAccordion}>
                    <summary className={styles.accordionHeader}>
                      <span className={styles.devIcon}>🐛</span>
                      Developer Info (Development Mode)
                    </summary>
                    <div className={styles.accordionContent}>
                      <div className={styles.errorBlock}>
                        <strong>Error:</strong>
                        <pre className={styles.errorText}>{this.state.error.toString()}</pre>
                      </div>
                      {this.state.error.stack && (
                        <div className={styles.errorBlock}>
                          <strong>Stack Trace:</strong>
                          <pre className={styles.errorText}>{this.state.error.stack}</pre>
                        </div>
                      )}
                      {this.state.errorInfo && this.state.errorInfo.componentStack && (
                        <div className={styles.errorBlock}>
                          <strong>Component Stack:</strong>
                          <pre className={styles.errorText}>{this.state.errorInfo.componentStack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button className={styles.primaryBtn} onClick={this.handleReload}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C12.0711 2.5 13.9461 3.35714 15.3033 4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M15 2.5V5H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Realign the Stars
              </button>
              <button className={styles.secondaryBtn} onClick={this.handleGoHome}>
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
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
