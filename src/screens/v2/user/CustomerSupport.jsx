import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Send, Mic, Check, Calendar, Clock } from "lucide-react";
import styles from "./CustomerSupport.module.scss";

const CustomerSupport = () => {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const messagesEndRef = useRef(null);

  // Quick action categories
  const quickActions = [
    { id: 1, label: "Session & Booking Issues" },
    { id: 2, label: "Payment & Earnings Help" },
    { id: 3, label: "Profile & Verification Support" },
    { id: 4, label: "Customer Complaint Alerts" },
    { id: 5, label: "Technical Assistance" },
    { id: 6, label: "Report a User" },
    { id: 7, label: "Reschedule & Availability Help" },
  ];

  // Sample order history data
  const orderHistory = [
    {
      id: 1,
      name: "Reeta Sanyal",
      date: "Oct 17, 2025",
      time: "04:38 PM",
      duration: "5 M 30 S",
      amount: 200,
      image: "https://i.pravatar.cc/100?img=1",
    },
    {
      id: 2,
      name: "Vaibhav Ranjan",
      date: "Oct 17, 2025",
      time: "04:38 PM",
      duration: "5 M 30 S",
      amount: 200,
      image: "https://i.pravatar.cc/100?img=2",
    },
    {
      id: 3,
      name: "Jasmine",
      date: "Oct 17, 2025",
      time: "04:38 PM",
      duration: "5 M 30 S",
      amount: 200,
      image: "https://i.pravatar.cc/100?img=3",
    },
  ];

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

  const handleQuickAction = (action) => {
    if (action.label === "Report a User") {
      const userMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: "Report a User",
        timestamp: new Date(),
      };

      const botResponse = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: "Sure 😊 Let us know which order can we help you with",
        timestamp: new Date(),
        showOrders: true,
      };

      setMessages((prev) => [...prev, userMessage, botResponse]);
    } else {
      const userMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: action.label,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
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
          <button className={styles.backButton} onClick={() => navigate(-1)}>
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
                <div className={styles.messageContent}>
                  <p className={styles.messageText}>{message.text}</p>
                  <span className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>

                {/* Quick Actions */}
                {message.id === "bot-1" && (
                  <div className={styles.quickActions}>
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        className={styles.quickActionButton}
                        onClick={() => handleQuickAction(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Order History Cards */}
                {message.showOrders && (
                  <div className={styles.orderHistory}>
                    {orderHistory.map((order) => (
                      <div
                        key={order.id}
                        className={styles.orderCard}
                        onClick={() => handleOrderSelect(order)}
                      >
                        <img
                          src={order.image}
                          alt={order.name}
                          className={styles.orderImage}
                        />
                        <div className={styles.orderDetails}>
                          <h3 className={styles.orderName}>{order.name}</h3>
                          <div className={styles.orderMeta}>
                            <span className={styles.orderMetaItem}>
                              <Calendar size={12} /> {order.date}
                            </span>
                            <span className={styles.orderMetaItem}>
                              <Clock size={12} /> {order.time}
                            </span>
                          </div>
                          <p className={styles.orderDuration}>
                            Duration: {order.duration}
                          </p>
                          <p className={styles.orderAmount}>₹{order.amount}</p>
                        </div>
                      </div>
                    ))}
                    <button className={styles.viewMoreButton}>View More</button>
                  </div>
                )}

                {/* Concerns List */}
                {message.showConcerns && (
                  <div className={styles.concernsList}>
                    {concerns.map((concern, index) => (
                      <button
                        key={index}
                        className={styles.concernButton}
                        onClick={() => handleConcernSelect(concern)}
                      >
                        {concern}
                      </button>
                    ))}
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
                {message.selectedOrder ? (
                  <div className={styles.userOrderCard}>
                    <div className={styles.userOrderCardInner}>
                      <img
                        src={message.selectedOrder.image}
                        alt={message.selectedOrder.name}
                        className={styles.userOrderImage}
                      />
                      <div className={styles.userOrderDetails}>
                        <h3 className={styles.userOrderName}>
                          {message.selectedOrder.name}
                        </h3>
                        <div className={styles.userOrderMeta}>
                          <span className={styles.userOrderMetaItem}>
                            <Calendar size={12} /> {message.selectedOrder.date}
                          </span>
                          <span className={styles.userOrderMetaItem}>
                            <Clock size={12} /> {message.selectedOrder.time}
                          </span>
                        </div>
                        <p className={styles.userOrderDuration}>
                          Duration: {message.selectedOrder.duration}
                        </p>
                        <p className={styles.userOrderAmount}>
                          ₹{message.selectedOrder.amount}
                        </p>
                      </div>
                    </div>
                    <span className={styles.userOrderTime}>
                      {formatTime(message.timestamp)} <Check size={12} />
                    </span>
                  </div>
                ) : (
                  <div className={styles.messageContent}>
                    <p className={styles.messageText}>{message.text}</p>
                    <span className={styles.messageTime}>
                      {formatTime(message.timestamp)} <Check size={12} />
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <input
          type="text"
          placeholder="Please text ..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className={styles.input}
        />
        <button className={styles.micButton}>
          <Mic size={20} />
        </button>
        <button className={styles.sendButton} onClick={handleSendMessage}>
          <Send size={20} />
        </button>
      </div>

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
    </div>
  );
};

export default CustomerSupport;
