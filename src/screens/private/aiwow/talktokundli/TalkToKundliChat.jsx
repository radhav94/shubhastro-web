import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TalkToKundliChat.module.scss';
import { Toast } from '../../../../component';
import { startKundliChat, sendKundliChatMessage } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';
import RouteLoader from '../../../../component/UI/RouteLoader';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';

const TalkToKundliChat = () => {
  const navigate = useNavigate();
  // Chat generation is gated by subscription/quota on the backend. Wrap the
  // start call so an entitlement block opens the plans popup instead of
  // silently bouncing the user back to the suite.
  const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName: 'talk-to-your-kundli' });
  // Guests have no token yet — show the add-kundli guest flow instead of
  // redirecting. Flips to true once the guest completes the flow.
  const [hasToken, setHasToken] = useState(
    () => !!localStorage.getItem("shubhtalk_customer_token")
  );
  // Don't force a profile/redirect for guests; the guest flow handles it.
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile({
    required: hasToken,
    showToast: hasToken,
  });

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What career path is best suited for me?",
    "When is a good time for marriage?",
    "What are my strengths and weaknesses?",
    "How will my financial situation be this year?"
  ]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  // Start session when profile is loaded
  useEffect(() => {
    if (hasToken && profile && !profileLoading) {
      startSession(profile);
    }
  }, [hasToken, profile, profileLoading]);

  // Auto-scroll to show latest message above input
  // Auto-scroll so the latest reply is fully in view above the input. Scroll
  // the container to its true bottom after the new message lays out (double
  // rAF) — a smooth scrollIntoView on a timeout can fire before the message
  // renders, leaving it hidden behind the input on mobile.
  const scrollToBottom = (behavior = 'auto') => {
    // The chat has nested scroll containers (the outer wrapper AND the inner
    // messages list). Scroll whichever one actually overflows so the latest
    // message is always brought into view.
    [scrollAreaRef.current, messagesContainerRef.current].forEach((el) => {
      if (el && el.scrollHeight > el.clientHeight) {
        el.scrollTo({ top: el.scrollHeight, behavior });
      }
    });
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToBottom('smooth'));
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, isLoading]);

  const startSession = async (profile) => {
    try {
      setIsLoading(true);

      const kundliData = {
        name: profile.name,
        day: profile.day,
        month: profile.month,
        year: profile.year,
        hour: profile.hour || 0,
        min: profile.minute || 0,
        place: profile.place,
        sunSign: profile.sunSign || '',
        moonSign: profile.moonSign || '',
        ascendant: profile.ascendant || ''
      };

      const result = await runWithEntitlement(() => startKundliChat(kundliData));

      // User closed the plans popup without purchasing — go back to the suite.
      // If the gate already routed to /recharge, don't override that redirect.
      if (result.blocked) {
        navigate('/ai-wow', { replace: true });
        return;
      }

      if (result.success) {
        const sessionData = result.data;
        setSessionId(sessionData.sessionId);
        
        // Add welcome message from API
        const welcomeMessage = {
          id: Date.now(),
          type: 'ai',
          text: sessionData.welcomeMessage || sessionData.message || `Hello ${profile.name}! I'm your personal astrology AI assistant. I have analyzed your birth chart and I'm ready to answer your questions about your life, career, relationships, and future. What would you like to know?`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);

        // Update suggested questions if provided by API
        if (sessionData.popularQuestions && Array.isArray(sessionData.popularQuestions)) {
          // Keep original format (string or object) - handled in render
          setSuggestedQuestions(sessionData.popularQuestions);
        } else if (sessionData.suggestedQuestions && Array.isArray(sessionData.suggestedQuestions)) {
          setSuggestedQuestions(sessionData.suggestedQuestions);
        }
      } else {
        // Error already handled by service and interceptor
        setTimeout(() => {
          navigate('/ai-wow', { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      setTimeout(() => {
        navigate('/ai-wow', { replace: true });
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (overrideText) => {
    const raw = typeof overrideText === 'string' ? overrideText : inputMessage;
    if (!raw.trim() || !sessionId || isLoading) return;

    const messageToSend = raw.trim();
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const result = await sendKundliChatMessage(sessionId, messageToSend);

      if (result.success) {
        const responseData = result.data;
        const aiResponseText = responseData?.assistantMessage?.content || 
                              responseData?.response || 
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
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question, e) => {
    if (isLoading || !sessionId) return;
    // Use the actual displayed text from the button (respects Google Translate)
    const displayedText = e?.currentTarget?.innerText || question;
    // Send the suggested question directly instead of only filling the input.
    setInputMessage('');
    sendMessage(displayedText);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Guest: open the add-kundli flow (kundli + OTP). On success the token and a
  // self kundli exist, so we flip to the chat.
  if (!hasToken) {
    return (
      <GuestKundliAuthModal
        isOpen
        onClose={() => navigate('/ai-wow')}
        onSuccess={() => setHasToken(true)}
      />
    );
  }

  if (profileLoading) {
    // Reserves in-flow height while the profile loads — see RouteLoader.
    return <RouteLoader message="Loading your birth details…" />;
  }

  return (
    <div className={`${styles.container} notranslate`} translate="no">
      {subscriptionModal}
      {/* Header */}
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>AI Kundli Assistant</h1>
            {profile && (
              <p className={styles.subtitle}>{profile.name}'s Chart</p>
            )}
          </div>
        </div>
      </header>
      
      <div className={styles.containerDiv} ref={scrollAreaRef}>
        <div className={styles.heiT}>
        {/* Messages */}
        <div className={styles.messagesContainer} ref={messagesContainerRef}>
          {/* Stays visible for the whole session start, including while
              isLoading. It used to be hidden as soon as startSession() set
              isLoading, so this text flashed for one frame and was replaced by an
              empty message bubble containing the typing dots — a "the AI is
              replying" affordance shown before any conversation existed. */}
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <p>Starting your personalized chat session...</p>
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

          {/* Only once there is something to reply to. The typing dots mean "the
              AI is composing a response"; during session start there is no
              conversation yet, so the empty state above covers that instead. */}
          {isLoading && messages.length > 0 && (
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
            <p className={styles.suggestedTitle}>Try asking:</p>
            <div className={styles.suggestedList}>
              {suggestedQuestions.map((question, index) => {
                // Handle both string and object formats from API
                // Always use the displayed text for input (same language user sees)
                const displayText = typeof question === 'object' 
                  ? (question.translatedText || question.text || question.label || question.question || question.value) 
                  : question;
                
                return (
                  <button
                    key={index}
                    className={styles.suggestedButton}
                    onClick={(e) => handleSuggestedQuestion(displayText, e)}
                  >
                    {displayText}
                  </button>
                );
              })}
            </div>
          </div>
        )}  
      </div>
      </div>

      {/* Input */}
      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Ask me anything about your kundli..."
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

export default TalkToKundliChat;
