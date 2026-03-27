import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Send, Mic, Check, Calendar, Clock, Phone, MessageSquare, Video } from "lucide-react";
import { useGetSupportQuestionsQuery, useLazyGetSubQuestionsQuery, useLazyGetUserSessionsQuery, useLazyGetSupportAnswerQuery, useCreateSupportTicketMutation } from "../../../redux/api/supportApi/supportApi";
import styles from "./CustomerSupport.module.scss";

const CustomerSupport = () => {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const messagesEndRef = useRef(null);

  const { data: supportData, isLoading: isLoadingQuestions } =
    useGetSupportQuestionsQuery("user");
  const quickActions = supportData?.data || [];

  const [fetchSessions] = useLazyGetUserSessionsQuery();
  const [fetchSubQuestions] = useLazyGetSubQuestionsQuery();
  const [fetchAnswer] = useLazyGetSupportAnswerQuery();
  const [createTicket] = useCreateSupportTicketMutation();

  const [sessions, setSessions] = useState([]);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [hasMoreSessions, setHasMoreSessions] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Track flow context for ticket creation
  const [currentTopicName, setCurrentTopicName] = useState("");
  const [currentConcernText, setCurrentConcernText] = useState("");

  // Ticket modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketIssue, setTicketIssue] = useState("");
  const [ticketContactMethod, setTicketContactMethod] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);

  const concerns = [
    "Customer support issue",
    "Customer abused",
    "Customer gave wrong details",
    "Customer's network was poor",
  ];

  // Initial bot message
  useEffect(() => {
    setMessages([
      {
        id: "bot-1",
        type: "bot",
        text: "Namaste 🙏 How can we help you today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuickAction = async (action) => {
    const label = action.question || action.label;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: label,
      timestamp: new Date(),
    };

    if (action.requiresEntityList) {
      setCurrentTopicName(label);
      setMessages((prev) => [...prev, userMessage]);
      setIsLoadingSessions(true);

      try {
        const res = await fetchSessions({ page: 1, limit: 3 }).unwrap();
        const list = res?.data?.recentSessions || [];
        setSessions(list);
        setSessionsPage(1);
        setHasMoreSessions(res?.data?.pagination?.hasNextPage ?? false);

        const botResponse = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: "Sure 😊 Let us know which order can we help you with",
          timestamp: new Date(),
          showOrders: true,
        };
        setMessages((prev) => [...prev, botResponse]);
      } catch {
        const errorResponse = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: "Sorry, we couldn't load your sessions. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoadingSessions(false);
      }
    } else {
      setCurrentTopicName(label);
      setMessages((prev) => [...prev, userMessage]);

      try {
        const res = await fetchSubQuestions({ mainQuestionId: action._id, role: "user" }).unwrap();
        const subQuestions = res?.data || [];

        if (subQuestions.length > 0) {
          const botResponse = {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: "Please select your concern",
            timestamp: new Date(),
            subQuestions,
          };
          setMessages((prev) => [...prev, botResponse]);
        }
      } catch {
        // silently fail
      }
    }
  };

  const handleViewMore = async () => {
    const nextPage = sessionsPage + 1;
    setIsLoadingSessions(true);
    try {
      const res = await fetchSessions({ page: nextPage, limit: 3 }).unwrap();
      const list = res?.data?.recentSessions || [];
      setSessions((prev) => [...prev, ...list]);
      setSessionsPage(nextPage);
      setHasMoreSessions(res?.data?.pagination?.hasNextPage ?? false);
    } catch {
      // silently fail
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: "Thank you for your message. Our support team will assist you shortly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleEscalation = (option) => {
    setTicketContactMethod(option.contactMethod);
    setTicketIssue("");
    setShowTicketModal(true);
  };

  const handleTicketSubmit = async () => {
    if (!ticketIssue.trim()) return;
    setIsSubmittingTicket(true);

    try {
      await createTicket({
        topicName: currentTopicName,
        concernText: currentConcernText,
        issue: ticketIssue.trim(),
        contactMethod: ticketContactMethod,
      }).unwrap();

      setShowTicketModal(false);
      setTicketIssue("");
      setTicketCreated(true);

      const botResponse = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: "Your ticket has been submitted successfully. Our team will reach out to you shortly.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch {
      // error handled by privateRequestNew
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleTicketCancel = () => {
    setShowTicketModal(false);
    setTicketIssue("");
  };

  const handleSubQuestionSelect = async (sub) => {
    setCurrentConcernText(sub.question);
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: sub.question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetchAnswer(sub._id).unwrap();
      const answers = res?.data || [];

      const regularAnswers = answers.filter((a) => !a.isEscalation);
      const escalationOptions = answers.filter((a) => a.isEscalation);

      // Show regular answers as bot text
      if (regularAnswers.length > 0) {
        const botResponse = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: regularAnswers.map((a) => a.text).join("\n\n"),
          timestamp: new Date(),
          escalationOptions: escalationOptions.length > 0 ? escalationOptions : null,
        };
        setMessages((prev) => [...prev, botResponse]);
      } else if (escalationOptions.length > 0) {
        const botResponse = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: "How would you like to connect with us?",
          timestamp: new Date(),
          escalationOptions,
        };
        setMessages((prev) => [...prev, botResponse]);
      }
    } catch {
      // silently fail
    }
  };

  const handleOrderSelect = (order) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      selectedOrder: order,
      timestamp: new Date(),
    };

    const botResponse = {
      id: `bot-${Date.now()}`,
      type: "bot",
      text: "Please select the concern you want to report",
      timestamp: new Date(),
      showConcerns: true,
    };

    setMessages((prev) => [...prev, userMessage, botResponse]);
  };

  const handleConcernSelect = (concern) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: concern,
      timestamp: new Date(),
    };

    const botResponse = {
      id: `bot-${Date.now()}`,
      type: "bot",
      text: "Please wait we are escalating this issue for better assistance.",
      timestamp: new Date(),
    };

    const finalResponse = {
      id: `bot-final-${Date.now()}`,
      type: "bot",
      text: "Namaste 🙏 I'm Aisha. Please tell me about your concern.",
      timestamp: new Date(),
      showEndChat: true,
    };

    setMessages((prev) => [...prev, userMessage, botResponse, finalResponse]);
  };

  const handleEndChat = () => {
    setShowRatingModal(true);
  };

  const handleRatingSubmit = () => {
    setShowRatingModal(false);
    // Handle rating submission
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionIcon = (type) => {
    switch (type) {
      case "audio": return <Phone size={16} />;
      case "video": return <Video size={16} />;
      case "chat": return <MessageSquare size={16} />;
      default: return <Phone size={16} />;
    }
  };

  return (
    <div className={styles.supportPage}>
      {/* Header */}
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate("/profile", { state: { activeTab: "Support" } })}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>Customer Support</h1>
          <div className={styles.headerSpacer}></div>
        </div>
      </header>

      {/* Messages Container */}
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === "bot" ? (
              <div className={styles.botMessage}>
                <div className={styles.botBubble}>
                  <p className={styles.messageText}>{message.text}</p>

                  {/* Quick Actions inside bubble */}
                  {message.id === "bot-1" && (
                    <div className={styles.quickActions}>
                      {isLoadingQuestions ? (
                        <p className={styles.messageText}>Loading options...</p>
                      ) : (
                        quickActions.map((action) => (
                          <button
                            key={action._id || action.id}
                            className={styles.quickActionButton}
                            onClick={() => handleQuickAction(action)}
                          >
                            {action.question || action.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Sub Questions inside bubble */}
                  {message.subQuestions?.length > 0 && (
                    <div className={styles.quickActions}>
                      {message.subQuestions.map((sub) => (
                        <button
                          key={sub._id}
                          className={styles.quickActionButton}
                          onClick={() => handleSubQuestionSelect(sub)}
                        >
                          {sub.question}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Concerns inside bubble */}
                  {message.showConcerns && (
                    <div className={styles.quickActions}>
                      {concerns.map((concern, index) => (
                        <button
                          key={index}
                          className={styles.quickActionButton}
                          onClick={() => handleConcernSelect(concern)}
                        >
                          {concern}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Escalation options */}
                  {message.escalationOptions?.length > 0 && (
                    <div className={styles.escalationActions}>
                      {message.escalationOptions.map((option) => (
                        <button
                          key={option._id}
                          className={styles.escalationButton}
                          onClick={() => handleEscalation(option)}
                        >
                          {option.contactMethod === "call" ? <Phone size={14} /> : <MessageSquare size={14} />}
                          {option.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className={styles.botTime}>
                  {formatTime(message.timestamp)}
                </span>

                {/* Session History Cards outside bubble */}
                {message.showOrders && (
                  <div className={styles.orderHistory}>
                    {sessions.map((session, index) => (
                      <div
                        key={session._id + "-" + index}
                        className={styles.orderCard}
                      >
                        <img
                          src={session.profileImgUrl || session.imageUrl}
                          alt={session.astrologerName}
                          className={styles.orderImage}
                        />
                        <div className={styles.orderDetails}>
                          <h3 className={styles.orderName}>
                            {session.astrologerName}
                          </h3>
                          <div className={styles.orderMeta}>
                            <span className={styles.orderMetaItem}>
                              <Calendar size={12} /> {new Date(session.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span className={styles.orderMetaItem}>
                              <Clock size={12} /> {new Date(session.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className={styles.orderDuration}>
                            Duration : {session.billedMinutes} M {((new Date(session.endTime) - new Date(session.startTime)) / 1000 % 60).toFixed(0)} S
                          </p>
                          <p className={styles.orderAmount}>₹{session.billedAmount}</p>
                        </div>
                        <span className={styles.sessionTypeIcon}>
                          {getSessionIcon(session.sessiontype)}
                        </span>
                      </div>
                    ))}
                    {isLoadingSessions && (
                      <p className={styles.loadingText}>Loading...</p>
                    )}
                    {hasMoreSessions && !isLoadingSessions && (
                      <button className={styles.viewMoreButton} onClick={handleViewMore}>
                        View More
                      </button>
                    )}
                  </div>
                )}

                {/* End Chat Button */}
                {message.showEndChat && (
                  <button className={styles.endChatButton} onClick={handleEndChat}>
                    End Chat
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.userMessage}>
                <div className={styles.userBubble}>
                  <p className={styles.messageText}>
                    {message.selectedOrder ? message.selectedOrder.astrologerName : message.text}
                  </p>
                </div>
                <span className={styles.userTime}>
                  {formatTime(message.timestamp)} <Check size={12} />
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!ticketCreated && (
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Start typing..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className={styles.input}
            />
            <button className={styles.micButton}>
              <Mic size={16} />
            </button>
            <button className={styles.sendButton} onClick={handleSendMessage}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className={styles.ratingModal}>
          <div className={styles.ratingModalContent}>
            <div className={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`${styles.starButton} ${selectedRating >= star ? styles.selected : ""}`}
                  onClick={() => setSelectedRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <h3 className={styles.ratingTitle}>Please Rate your Experience</h3>
            <button className={styles.submitRatingButton} onClick={handleRatingSubmit}>
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className={styles.ticketModal}>
          <div className={styles.ticketModalContent}>
            <h3 className={styles.ticketModalTitle}>Describe your issue</h3>
            <textarea
              className={styles.ticketTextarea}
              placeholder="Please describe your issue in detail..."
              value={ticketIssue}
              onChange={(e) => setTicketIssue(e.target.value)}
              rows={4}
            />
            <div className={styles.ticketModalActions}>
              <button
                className={styles.ticketCancelButton}
                onClick={handleTicketCancel}
                disabled={isSubmittingTicket}
              >
                Cancel
              </button>
              <button
                className={styles.ticketSubmitButton}
                onClick={handleTicketSubmit}
                disabled={!ticketIssue.trim() || isSubmittingTicket}
              >
                {isSubmittingTicket ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSupport;
