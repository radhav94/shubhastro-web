import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CosmicChat.module.scss';
import { Toast, MessageTicks, ReplyPreview } from '../../../../component';
import { IoArrowUndo } from 'react-icons/io5';
import { startCosmicChat, sendCosmicChatMessage } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';
import RouteLoader from '../../../../component/UI/RouteLoader';
// Footer removed - route has footer: false, chat input is fixed at bottom

const CosmicChat = () => {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();
  // Chat generation is gated by subscription/quota on the backend. Wrap the
  // start call so an entitlement block opens the plans popup instead of
  // silently bouncing the user back to the suite.
  const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName: 'cosmic-chat' });

  useEffect(() => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) {
      localStorage.setItem("shubhtalk_redirect_after_login", "/aiwow/cosmic-chat");
      window.location.href = "/login?skip=welcome";
    }
  }, []);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  // The message the user is currently composing a reply to (null = normal send).
  const [replyingTo, setReplyingTo] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What cosmic energies are influencing me today?",
    "How can I align with the universe's flow?",
    "What spiritual lessons should I focus on?",
    "How do planetary transits affect my life?"
  ]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);
  // messageId -> DOM node, so a reply quote can scroll to its original message.
  const messageNodesRef = useRef({});
  // The message briefly flashed after jumping to it.
  const [highlightedId, setHighlightedId] = useState(null);
  const highlightTimerRef = useRef(null);

  const jumpToMessage = (messageId) => {
    const node = messageId && messageNodesRef.current[messageId];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(messageId);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedId(null), 1600);
  };

  useEffect(() => () => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
  }, []);

  // Start session when profile is loaded
  useEffect(() => {
    if (profile && !profileLoading) {
      startSession(profile);
    }
  }, [profile, profileLoading]);

  // Auto-scroll so the latest (often long) reply is fully in view above the
  // input. Use the scroll container directly and wait for the reply to lay out
  // (double rAF) — a smooth scrollIntoView on a timeout can fire before the new
  // message has rendered, leaving it partly hidden behind the input on mobile.
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
        tzone: profile.tzone || 5.5
      };

      const result = await runWithEntitlement(() => startCosmicChat(kundliData));

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
          messageId: sessionData.welcomeMessageId || `welcome-${Date.now()}`,
          type: 'ai',
          text: sessionData.welcomeMessage || sessionData.message || `Namaste ${profile.name}! 🌟 I am your Cosmic Chat AI, connected to the universal energies and your birth chart. I can help you understand cosmic influences, planetary transits, and spiritual guidance. What would you like to explore?`,
          status: 'sent',
          replyTo: null,
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

  const sendMessage = async (overrideText, refocusInput = true) => {
    const raw = typeof overrideText === 'string' ? overrideText : inputMessage;
    if (!raw.trim() || !sessionId || isLoading) return;

    const messageToSend = raw.trim();
    // Capture the reply target for this send, then clear the composer chip.
    const replyTarget = replyingTo;
    const localId = Date.now();
    const userMessage = {
      id: localId,
      messageId: null,
      type: 'user',
      text: messageToSend,
      // Show the blue (read) tick right away — per the backend, user messages
      // are always delivered+read, so there's no reason to hold on the clock
      // while the AI composes its (separate) reply.
      status: 'read',
      replyTo: replyTarget
        ? {
            messageId: replyTarget.messageId,
            role: replyTarget.type === 'user' ? 'user' : 'assistant',
            content: replyTarget.text,
          }
        : null,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setReplyingTo(null);
    setIsLoading(true);

    try {
      const result = await sendCosmicChatMessage(
        sessionId,
        messageToSend,
        replyTarget?.messageId || null
      );

      if (result.success) {
        const responseData = result.data;
        const aiResponseText = responseData?.response || 
                              responseData?.assistantMessage?.content || 
                              responseData?.message || 
                              'I apologize, but I could not process your request. Please try again.';

        // Reconcile the optimistic user bubble with the server's messageId and
        // status. Per the backend, user messages come back as "read" (blue tick).
        const serverUserMsg = responseData?.userMessage;
        setMessages(prev =>
          prev.map(m =>
            m.id === localId
              ? {
                  ...m,
                  messageId: serverUserMsg?.messageId || m.messageId,
                  status: serverUserMsg?.status || 'read',
                  replyTo: serverUserMsg?.replyTo || m.replyTo,
                }
              : m
          )
        );

        const aiMessage = {
          id: Date.now() + 1,
          messageId:
            responseData?.assistantMessage?.messageId ||
            responseData?.messageId ||
            `ai-${Date.now()}`,
          type: 'ai',
          text: aiResponseText,
          status: responseData?.assistantMessage?.status || 'sent',
          replyTo: null,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Send failed — mark the user bubble sent (it did leave the client) and
        // surface an AI error bubble.
        setMessages(prev =>
          prev.map(m => (m.id === localId ? { ...m, status: 'sent' } : m))
        );
        const errorMessage = {
          id: Date.now() + 1,
          messageId: `ai-err-${Date.now()}`,
          type: 'ai',
          text: 'I apologize, but I encountered an error. Please try asking your question again.',
          status: 'sent',
          replyTo: null,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      setMessages(prev =>
        prev.map(m => (m.id === localId ? { ...m, status: 'sent' } : m))
      );
      const errorMessage = {
        id: Date.now() + 1,
        messageId: `ai-err-${Date.now()}`,
        type: 'ai',
        text: 'I apologize, but I encountered an error. Please try asking your question again.',
        status: 'sent',
        replyTo: null,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Refocus the input (keeps the keyboard up) only on non-touch/desktop.
      // On mobile, auto-focusing after a reply pops the on-screen keyboard,
      // which shrinks the viewport and hides the freshly-arrived answer — so we
      // never auto-focus on touch devices.
      const isTouchDevice = typeof window !== 'undefined' &&
        (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
      if (refocusInput && !isTouchDevice) {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    // Send the suggested question directly instead of only filling the input.
    if (isLoading || !sessionId) return;
    setInputMessage('');
    // Don't refocus the input — that would open the mobile keyboard and hide
    // the incoming answer.
    sendMessage(question, false);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    // Bring up the composer so the user can type the reply immediately.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Guests are redirected to login by the effect above; render nothing until
  // then. Placed after all hooks so hook order stays consistent.
  if (!localStorage.getItem("shubhtalk_customer_token")) return null;

  if (profileLoading) {
    // Reserves in-flow height while the profile loads — see RouteLoader.
    return <RouteLoader message="Loading your birth details…" />;
  }

  return (
    <>
    {subscriptionModal}
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
      <div className={styles.containerDiv} ref={scrollAreaRef}>
        <div className={styles.heiT}>
          <div className={styles.messagesContainer} ref={messagesContainerRef}>
          {/* Stays visible for the whole session start, including while
              isLoading — see the matching note in TalkToKundliChat. */}
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✨</div>
              <p>Connecting to cosmic energies...</p>
            </div>
          )}

        {messages.map((message) => {
          const isUser = message.type === 'user';
          const isHighlighted =
            message.messageId && message.messageId === highlightedId;
          return (
          <div
            key={message.id}
            ref={(node) => {
              if (message.messageId) {
                if (node) messageNodesRef.current[message.messageId] = node;
                else delete messageNodesRef.current[message.messageId];
              }
            }}
            className={`${styles.messageWrapper} ${
              isUser ? styles.userMessage : styles.aiMessage
            } ${isHighlighted ? styles.highlighted : ''}`}
          >
            <div className={styles.messageBubble}>
              {message.replyTo && (
                <ReplyPreview
                  reply={message.replyTo}
                  variant="bubble"
                  onJumpTo={jumpToMessage}
                />
              )}
              <p className={styles.messageText}>{message.text}</p>
              <span className={styles.messageMeta}>
                <span className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {isUser && <MessageTicks status={message.status} />}
              </span>
            </div>
            {/* Reply affordance — only for messages that carry a server id. */}
            {message.messageId && (
              <button
                type="button"
                className={styles.replyButton}
                onClick={() => handleReply(message)}
                aria-label="Reply to this message"
                title="Reply"
              >
                <IoArrowUndo size={15} />
              </button>
            )}
          </div>
          );
        })}

        {/* Only once there is something to reply to — see the matching note in
            TalkToKundliChat. */}
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
      </div>

      {/* Input */}
      <div className={styles.inputContainer}>
        {replyingTo && (
          <div className={styles.replyComposer}>
            <ReplyPreview
              reply={{
                messageId: replyingTo.messageId,
                role: replyingTo.type === 'user' ? 'user' : 'assistant',
                content: replyingTo.text,
              }}
              variant="composer"
              onCancel={() => setReplyingTo(null)}
            />
          </div>
        )}
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Ask about cosmic energies..."
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
    </>
  );
};

export default CosmicChat;
