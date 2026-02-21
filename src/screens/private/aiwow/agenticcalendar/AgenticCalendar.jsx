import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AgenticCalendar.module.scss';
import { Toast } from '../../../../component';
import { analyzeCalendarEvents } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';

const AgenticCalendar = () => {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();
  
  const [events, setEvents] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const commonEvents = [
    'Marriage',
    'Job Interview',
    'Business Launch',
    'House Purchase',
    'Travel',
    'Surgery',
    'Investment',
    'Education',
    'Moving House',
    'Important Meeting'
  ];

  const handleAddEvent = () => {
    setEvents([...events, '']);
  };

  const handleRemoveEvent = (index) => {
    if (events.length > 1) {
      const newEvents = events.filter((_, i) => i !== index);
      setEvents(newEvents);
    }
  };

  const handleEventChange = (index, value) => {
    const newEvents = [...events];
    newEvents[index] = value;
    setEvents(newEvents);
  };

  const handleQuickAdd = (event) => {
    const lastEvent = events[events.length - 1];
    if (lastEvent === '') {
      const newEvents = [...events];
      newEvents[newEvents.length - 1] = event;
      setEvents(newEvents);
    } else {
      setEvents([...events, event]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validEvents = events.filter(event => event.trim() !== '');
    
    if (validEvents.length === 0) {
      Toast.error('Please add at least one event');
      return;
    }

    try {
      setIsLoading(true);

      const result = await analyzeCalendarEvents(validEvents);

      if (result.success) {
        setAnalysis(result.data);
      }
    } catch (error) {
      console.error('Failed to analyze events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (analysis) {
      setAnalysis(null);
      setEvents(['']);
    } else {
      navigate(-1);
    }
  };

  const handleNewAnalysis = () => {
    setAnalysis(null);
    setEvents(['']);
  };

  if (profileLoading) {
    return <PrimaryLoader isLoading={true} />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Agentic Calendar</h1>
            {profile && (
              <p className={styles.subtitle}>{profile.name}</p>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {!analysis ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.introSection}>
              <div className={styles.introIcon}>📅</div>
              <h2 className={styles.introTitle}>Plan Your Events</h2>
              <p className={styles.introText}>
                Get astrologically optimal timing recommendations for your important life events
              </p>
            </div>

            {/* Quick Add Buttons */}
            <div className={styles.quickAddSection}>
              <h3 className={styles.quickAddTitle}>Quick Add Common Events</h3>
              <div className={styles.quickAddButtons}>
                {commonEvents.map((event, index) => (
                  <button
                    key={index}
                    type="button"
                    className={styles.quickAddButton}
                    onClick={() => handleQuickAdd(event)}
                  >
                    + {event}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Inputs */}
            <div className={styles.eventsSection}>
              <h3 className={styles.eventsTitle}>Your Events</h3>
              <div className={styles.eventsList}>
                {events.map((event, index) => (
                  <div key={index} className={styles.eventItem}>
                    <input
                      type="text"
                      className={styles.eventInput}
                      placeholder={`Event ${index + 1} (e.g., Marriage, Job Interview)`}
                      value={event}
                      onChange={(e) => handleEventChange(index, e.target.value)}
                      disabled={isLoading}
                    />
                    {events.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemoveEvent(index)}
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={styles.addEventButton}
                onClick={handleAddEvent}
                disabled={isLoading || events.length >= 10}
              >
                + Add Another Event
              </button>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading || events.every(e => e.trim() === '')}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Analyzing Events...
                </>
              ) : (
                'Get Timing Recommendations'
              )}
            </button>
          </form>
        ) : (
          <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
              <div className={styles.resultIcon}>✨</div>
              <h2 className={styles.resultTitle}>Timing Recommendations</h2>
            </div>

            {/* Events Analysis */}
            {analysis.optimalTimings && analysis.optimalTimings.length > 0 && (
              <div className={styles.eventsAnalysis}>
                {analysis.optimalTimings.map((timing, index) => (
                  <div key={index} className={styles.eventCard}>
                    <div className={styles.eventCardHeader}>
                      <h3 className={styles.eventName}>{timing.eventName}</h3>
                      {timing.muhuratScore && (
                        <span className={styles.scoreBadge}>
                          {timing.muhuratScore}/100
                        </span>
                      )}
                    </div>

                    {/* Best Timing */}
                    <div className={styles.timingSection}>
                      <h4 className={styles.timingTitle}>🌟 Optimal Timing</h4>
                      <div className={styles.timingDetails}>
                        {timing.bestDate && (
                          <p className={styles.timingText}>
                            <strong>Date:</strong> {timing.bestDate}
                          </p>
                        )}
                        {timing.bestTimeRange && (
                          <p className={styles.timingText}>
                            <strong>Time:</strong> {timing.bestTimeRange}
                          </p>
                        )}
                        {timing.muhuratType && (
                          <p className={styles.timingText}>
                            <strong>Muhurat Type:</strong>{' '}
                            <span className={styles.muhuratType}>
                              {timing.muhuratType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </p>
                        )}
                        {timing.reason && (
                          <p className={styles.timingReason}>{timing.reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* General Guidance */}
            {analysis.generalGuidance && (
              <div className={styles.guidanceCard}>
                <div className={styles.guidanceIcon}>🔮</div>
                <div className={styles.guidanceContent}>
                  <h3 className={styles.guidanceTitle}>General Guidance</h3>
                  <p className={styles.guidanceText}>{analysis.generalGuidance}</p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button className={styles.newAnalysisButton} onClick={handleNewAnalysis}>
              Analyze More Events
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgenticCalendar;
