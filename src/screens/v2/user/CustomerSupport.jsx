import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Send, Mic, Check, Phone, MessageSquare } from "lucide-react";
import { useGetSupportQuestionsQuery, useLazyGetSubTopicsQuery, useLazyGetSupportEntitySessionsQuery, useCreateSupportTicketMutation } from "../../../redux/api/supportApi/supportApi";
import EntityCard from "./entityCards/EntityCard";
import entityCardStyles from "./entityCards/EntityCards.module.scss";
import RatingCard from "./RatingCard";
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

  const [fetchSessions] = useLazyGetSupportEntitySessionsQuery();
  const [fetchSubTopics] = useLazyGetSubTopicsQuery();
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
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [currentConnectVia, setCurrentConnectVia] = useState([]);
  const [currentEntityType, setCurrentEntityType] = useState("");

  // Extract entity list from different API response shapes
  const extractEntityList = (data) => {
    const list = data?.sessions || data?.astrologers || data?.orders || [];
    return Array.isArray(list) ? list : [];
  };

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
    const label = action.topic || action.question || action.label;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: label,
      timestamp: new Date(),
    };

    if (action.requiresEntityList) {
      setCurrentTopicName(label);
      setMessages((prev) => [...prev, userMessage]);

      try {
        const topicRes = await fetchSubTopics(action._id).unwrap();
        const topicDetail = topicRes?.data || {};
        const subQuestionList = topicDetail.supportingQuestionList || [];
        const connectVia = topicDetail.connectVia || action.connectVia || [];

        if (subQuestionList.length > 0) {
          const subQuestions = subQuestionList.map((q, i) => ({
            _id: `${action._id}-sub-${i}`,
            question: q,
          }));

          const botResponse = {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: "Please select your concern",
            timestamp: new Date(),
            subQuestions,
            connectVia,
            showSessionsAfter: true,
            entityType: topicDetail.entityType,
          };
          setMessages((prev) => [...prev, botResponse]);
        }
      } catch {
        const errorResponse = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorResponse]);
      }
    } else {
      setCurrentTopicName(label);
      setMessages((prev) => [...prev, userMessage]);

      try {
        const res = await fetchSubTopics(action._id).unwrap();
        const topicDetail = res?.data || {};

        // Get sub-questions from web platform
        const webPlatform = topicDetail.platform?.find((p) => p.type === "web");
        const subQuestionList = webPlatform?.supportingQuestionList || [];
        const connectVia = topicDetail.connectVia || action.connectVia || [];

        if (subQuestionList.length > 0) {
          const subQuestions = subQuestionList.map((q, i) => ({
            _id: `${action._id}-sub-${i}`,
            question: q,
          }));

          const botResponse = {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: "Please select your concern",
            timestamp: new Date(),
            subQuestions,
            connectVia,
          };
          setMessages((prev) => [...prev, botResponse]);
        } else if (connectVia.length > 0) {
          // Directly open issue modal instead of showing escalation options
          setTicketContactMethod(connectVia[0] || "chat");
          setTicketIssue("");
          setShowTicketModal(true);
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
      const res = await fetchSessions({ entityType: currentEntityType, page: nextPage, limit: 3 }).unwrap();
      const list = res?.data?.sessions || res?.data || [];
      setSessions((prev) => [...prev, ...(Array.isArray(list) ? list : [])]);
      setSessionsPage(nextPage);
      setHasMoreSessions((res?.data?.pagination?.page || 1) < (res?.data?.pagination?.totalPages || 1));
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

  const handleSessionSelect = (item) => {
    const entityId = currentEntityType === "astrologers" || currentEntityType === "astrologer"
      ? (item.astrologerId || item._id)
      : item._id;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      timestamp: new Date(),
      selectedSession: item,
    };
    setMessages((prev) => [...prev, userMessage]);

    setSelectedEntity({
      entity: currentEntityType,
      entityId,
    });
    setTicketContactMethod(currentConnectVia[0] || "chat");
    setTicketIssue("");

    setTimeout(() => setShowTicketModal(true), 300);
  };

  const handleTicketSubmit = async () => {
    if (!ticketIssue.trim()) return;
    setIsSubmittingTicket(true);

    try {
      const result = await createTicket({
        topicName: currentTopicName,
        ...(selectedEntity ? {
          entity: selectedEntity.entity,
          entityId: selectedEntity.entityId,
        } : {
          concernText: currentConcernText,
        }),
        platform: "web",
        issue: ticketIssue.trim(),
        contactMethod: ticketContactMethod,
      }).unwrap();

      const newTicketId = result?.data?._id || result?.data?.ticketId || null;
      setShowTicketModal(false);
      setTicketIssue("");
      setTicketCreated(true);
      setSelectedEntity(null);

      const botResponse = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: "Your ticket has been submitted successfully. Our team will reach out to you shortly.",
        timestamp: new Date(),
        showTicketActions: true,
        ticketId: newTicketId,
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
    setSelectedEntity(null);
  };

  const handleSubQuestionSelect = async (sub, connectVia, showSessionsAfter, entityType) => {
    setCurrentConcernText(sub.question);
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: sub.question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    if (showSessionsAfter && entityType) {
      setCurrentEntityType(entityType);
      setIsLoadingSessions(true);
      try {
        const res = await fetchSessions({ entityType, page: 1, limit: 3 }).unwrap();
        const list = extractEntityList(res?.data);
        setSessions(list);
        setSessionsPage(1);
        setHasMoreSessions((res?.data?.pagination?.page || 1) < (res?.data?.pagination?.totalPages || 1));

        const botResponse = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: "Sure 😊 Let us know which session this is about",
          timestamp: new Date(),
          showOrders: true,
          connectVia,
        };
        setCurrentConnectVia(connectVia);
        setMessages((prev) => [...prev, botResponse]);
      } catch {
        // silently fail
      } finally {
        setIsLoadingSessions(false);
      }
    } else {
      // Non-entity topic — directly open issue modal
      if (connectVia?.length > 0) {
        setTicketContactMethod(connectVia[0] || "chat");
        setTicketIssue("");
        setShowTicketModal(true);
      }
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
                            {action.topic || action.question || action.label}
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
                          onClick={() => handleSubQuestionSelect(sub, message.connectVia, message.showSessionsAfter, message.entityType)}
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

                  {/* Ticket success actions: View Ticket + Rating */}
                  {message.showTicketActions && (
                    <div className={styles.ticketActions}>
                      {message.ticketId && (
                        <button
                          className={styles.viewTicketButton}
                          onClick={() => navigate(`/recent-tickets/${message.ticketId}`)}
                        >
                          View Ticket Details
                        </button>
                      )}
                      <RatingCard ticketId={message.ticketId} />
                    </div>
                  )}
                </div>

                <span className={styles.botTime}>
                  {formatTime(message.timestamp)}
                </span>

                {/* Entity Cards */}
                {message.showOrders && (
                  <div className={styles.orderHistory}>
                    {sessions.map((item, index) => (
                      <EntityCard
                        key={item._id || item.astrologerId || index}
                        entityType={currentEntityType}
                        item={item}
                        onClick={handleSessionSelect}
                      />
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
                {message.selectedSession ? (
                  <div className={entityCardStyles.selectedCard}>
                    <EntityCard
                      entityType={currentEntityType}
                      item={message.selectedSession}
                    />
                    <span className={styles.userTime}>
                      {formatTime(message.timestamp)} <Check size={12} />
                    </span>
                  </div>
                ) : (
                  <>
                    <div className={styles.userBubble}>
                      <p className={styles.messageText}>{message.text}</p>
                    </div>
                    <span className={styles.userTime}>
                      {formatTime(message.timestamp)} <Check size={12} />
                    </span>
                  </>
                )}
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
