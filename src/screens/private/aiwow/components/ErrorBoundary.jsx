import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ErrorBoundary.module.scss';

/**
 * Error Boundary for AI Wow modules
 * Catches React errors and provides fallback UI
 */
class AIWowErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AIWow Error Boundary caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
    
    // Navigate to instructions page
    if (this.props.resetPath) {
      window.location.href = this.props.resetPath;
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="#ef4444" strokeWidth="2" fill="none"/>
                <path d="M32 20V36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="32" cy="44" r="2" fill="#ef4444"/>
              </svg>
            </div>
            
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorMessage}>
              We encountered an unexpected error. Please try again.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development Only)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className={styles.errorActions}>
              <button 
                className={styles.retryButton}
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button 
                className={styles.homeButton}
                onClick={() => window.location.href = '/ai-wow'}
              >
                Go to Shubh AI Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for Error Boundary with navigation
 */
export const AIWowErrorBoundaryWrapper = ({ children, moduleName = 'aiwow' }) => {
  const navigate = useNavigate();
  
  const resetPath = `/aiwow/${moduleName}/instructions`;
  
  return (
    <AIWowErrorBoundary resetPath={resetPath}>
      {children}
    </AIWowErrorBoundary>
  );
};

export default AIWowErrorBoundary;
