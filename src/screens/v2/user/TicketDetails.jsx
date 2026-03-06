import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import styles from "./TicketDetails.module.scss";

const TicketDetails = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [rating, setRating] = useState(0);

  // Sample ticket data - in real app, fetch based on ticketId
  const ticket = {
    id: ticketId || "1896",
    status: "ongoing",
    date: "Oct 01, 2025",
    time: "04:36 PM",
    topic: "Booking and Consultation",
  };

  // Sample chat messages
  const messages = [
    {
      id: 1,
      type: "received",
      text: "Please wait we are escalating this issue for better assistance.",
      time: "4:26",
    },
    {
      id: 2,
      type: "received",
      text: "Namaste 🙏 I'm Aisha. Please tell me about your concern.",
      time: "4:26",
    },
    {
      id: 3,
      type: "sent",
      text: "Astrologer didn't answer my query and was talking about irrelevant topics.",
      time: "4:26",
      isRead: true,
    },
    {
      id: 4,
      type: "received",
      text: "Is it okay if I can listen to your call recording for better understanding.",
      time: "4:26",
    },
    {
      id: 5,
      type: "sent",
      text: "Yes",
      time: "4:26",
      isRead: true,
    },
    {
      id: 6,
      type: "received",
      text: "Thanks",
      time: "4:26",
    },
    {
      id: 7,
      type: "received",
      text: "Upon listening to your call recording we realised your query wasn't addressed. We have credited ₹50 to you ShubhAstro Wallet. Is there anything else we can help you with?",
      time: "4:26",
    },
    {
      id: 8,
      type: "sent",
      text: "No",
      time: "4:26",
      isRead: true,
    },
    {
      id: 9,
      type: "received",
      text: "Thanks. Have a good day.",
      time: "4:26",
    },
  ];

  const handleRating = (value) => {
    setRating(value);
  };

  return (
    <div className={styles.ticketDetailsPage}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>#{ticket.id}</h1>
        <span
          className={`${styles.statusBadge} ${
            ticket.status === "ongoing"
              ? styles.statusOngoing
              : styles.statusResolved
          }`}
        >
          {ticket.status === "ongoing" ? "● Ongoing" : "● Resolved"}
        </span>
      </div>

      {/* Chat Messages */}
      <div className={styles.chatContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageWrapper} ${
              message.type === "sent" ? styles.sentWrapper : styles.receivedWrapper
            }`}
          >
            <div
              className={`${styles.message} ${
                message.type === "sent" ? styles.sentMessage : styles.receivedMessage
              }`}
            >
              <p className={styles.messageText}>{message.text}</p>
              <div className={styles.messageFooter}>
                <span className={styles.messageTime}>{message.time}</span>
                {message.type === "sent" && message.isRead && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={styles.readIcon}
                  >
                    <path
                      d="M2 8.5L5.5 12L14 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5.5 8.5L9 12L14 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Rating Card */}
        <div className={styles.ratingCard}>
          <div className={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={styles.starButton}
                onClick={() => handleRating(star)}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill={star <= rating ? "#FF9D7E" : "#FFD4C4"}
                >
                  <path d="M24 4L28.944 18.528H44.472L32.264 27.472L37.208 42L24 33.056L10.792 42L15.736 27.472L3.528 18.528H19.056L24 4Z" />
                </svg>
              </button>
            ))}
          </div>
          <p className={styles.ratingText}>Please Rate your Experience</p>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
