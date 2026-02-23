import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CosmicChat.module.scss';
import { Toast } from '../../../../component';
import { startCosmicChat, sendCosmicChatMessage } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';

const CosmicChat = () => {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What cosmic energies are influencing me today?",
    "How can I align with the universe's flow?",
    "What spiritual lessons should I focus on?",
    "How do planetary transits affect my life?"
  ]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Start session when profile is loaded
  useEffect(() => {
    if (profile && !profileLoading) {
      startSession(profile);
    }
  }, [profile, profileLoading]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startSession = async (profile) => {
    try {
      setIsLoading(true);

      const kundliData = {
        name: profile.name,
        gender: profile.identity || 'Male',
        day: profile.day,
        month: profile.month,
        year: profile.year,
        hour: profile.hour || 0,
        min: profile.minute || 0,
        second: 0,
        place: profile.place,
        lat: String(profile.latitude || '0'),
        lon: String(profile.longitude || '0'),
        tzone: profile.timezone || 5.5
      };

      const result = await startCosmicChat(kundliData);

      if (result.success) {
        const sessionData = result.data;
        setSessionId(sessionData.sessionId);
        
        // Add welcome message from API
        const welcomeMessage = {
          id: Date.now(),
          type: 'ai',
          text: sessionData.welcomeMessage || sessionData.message || `Namaste ${profile.name}! 🌟 I am your Cosmic Chat AI, connected to the universal energies and your birth chart. I can help you understand cosmic influences, planetary transits, and spiritual guidance. What would you like to explore?`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);

        // Update suggested questions if provided by API
        if (sessionData.suggestedQuestions && Array.isArray(sessionData.suggestedQuestions)) {
          setSuggestedQuestions(sessionData.suggestedQuestions);
        } else if (sessionData.popularQuestions && Array.isArray(sessionData.popularQuestions)) {
          setSuggestedQuestions(sessionData.popularQuestions);
        }
      } else {
        // Error already handled by service and interceptor
        setTimeout(() => {
          navigate('/aiwow', { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      setTimeout(() => {
        navigate('/aiwow', { replace: true });
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const result = await sendCosmicChatMessage(sessionId, inputMessage.trim());

      if (result.success) {
        const responseData = result.data;
        const aiResponseText = responseData?.response || 
                              responseData?.assistantMessage?.content || 
                              responseData?.message || 
                              'I apologize, but I could not process your request. Please try again.';

        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          text: aiResponseText,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Error already handled by service and interceptor
        const errorMessage = {
          id: Date.now() + 1,
          type: 'ai',
          text: 'I apologize, but I encountered an error. Please try asking your question again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: 'I apologize, but I encountered an error. Please try asking your question again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  const handleBack = () => {
    navigate(-1);
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
            <h1 className={styles.title}>Cosmic Chat</h1>
            {profile && (
              <p className={styles.subtitle}>{profile.name}'s Cosmic Journey</p>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.containerDiv}>
      <div className={styles.messagesContainer}>
        {messages.length === 0 && !isLoading && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✨</div>
            <p>Connecting to cosmic energies...</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageWrapper} ${
              message.type === 'user' ? styles.userMessage : styles.aiMessage
            }`}
          >
            <div className={styles.messageBubble}>
              <p className={styles.messageText}>{message.text}</p>
              <span className={styles.messageTime}>
                {message.timestamp.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.messageWrapper} ${styles.aiMessage}`}>
            <div className={styles.messageBubble}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && !isLoading && (
        <div className={styles.suggestedQuestions}>
          <p className={styles.suggestedTitle}>Explore cosmic insights:</p>
          <div className={styles.suggestedList}>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                className={styles.suggestedButton}
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      </div>

      {/* Input */}
      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Ask about cosmic energies, transits, spiritual guidance..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading || !sessionId}
          />
          <button
            className={styles.sendButton}
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !sessionId}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 8L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CosmicChat;
