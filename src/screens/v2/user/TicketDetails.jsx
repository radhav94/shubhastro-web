import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useGetTicketByIdQuery, useRateTicketMutation } from "../../../redux/api/supportApi/supportApi";
import styles from "./TicketDetails.module.scss";

const TicketDetails = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  const { data: ticketData, isLoading } = useGetTicketByIdQuery(ticketId);
  const [rateTicket, { isLoading: isRating }] = useRateTicketMutation();
  const ticket = ticketData?.data || {};

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusLabel = (status) => {
    if (status === "resolved" || status === "closed") return "● Resolved";
    return "● " + (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending");
  };

  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  const handleRating = async (star) => {
    setRating(star);
    try {
      await rateTicket({ ticketId: ticket._id || ticketId, rating: star, feedback: "" }).unwrap();
      setRated(true);
    } catch {
      // error handled by privateRequestNew
    }
  };

  if (isLoading) {
    return (
      <div className={styles.ticketDetailsPage}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ticketDetailsPage}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>{ticket.ticketId || `#${ticketId}`}</h1>
        <span
          className={`${styles.statusBadge} ${isResolved ? styles.statusResolved : styles.statusOngoing}`}
        >
          {getStatusLabel(ticket.status)}
        </span>
      </div>

      <div className={styles.chatContainer}>
        {ticket.topicName && (
          <div className={`${styles.messageWrapper} ${styles.receivedWrapper}`}>
            <div className={`${styles.message} ${styles.receivedMessage}`}>
              <p className={styles.messageText}>Topic: {ticket.topicName}</p>
              {ticket.concernText && (
                <p className={styles.messageText}>Concern: {ticket.concernText}</p>
              )}
              <div className={styles.messageFooter}>
                <span className={styles.messageTime}>{formatTime(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
        )}

        {ticket.issue && (
          <div className={`${styles.messageWrapper} ${styles.sentWrapper}`}>
            <div className={`${styles.message} ${styles.sentMessage}`}>
              <p className={styles.messageText}>{ticket.issue}</p>
              <div className={styles.messageFooter}>
                <span className={styles.messageTime}>{formatTime(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
        )}

        {ticket.messages?.map((message, index) => (
          <div
            key={message._id || index}
            className={`${styles.messageWrapper} ${
              message.senderType === "user" ? styles.sentWrapper : styles.receivedWrapper
            }`}
          >
            <div
              className={`${styles.message} ${
                message.senderType === "user" ? styles.sentMessage : styles.receivedMessage
              }`}
            >
              <p className={styles.messageText}>{message.text}</p>
              <div className={styles.messageFooter}>
                <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}

        {ticket.contactMethod && (
          <div className={`${styles.messageWrapper} ${styles.receivedWrapper}`}>
            <div className={`${styles.message} ${styles.receivedMessage}`}>
              <p className={styles.messageText}>
                Preferred contact: {ticket.contactMethod === "chat" ? "Chat" : "Call"}
              </p>
              <div className={styles.messageFooter}>
                <span className={styles.messageTime}>{formatTime(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating Card - sticky bottom */}
      <div className={styles.ratingCardFixed}>
        <div className={styles.ratingCard}>
          <div className={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={styles.starButton}
                onClick={() => !rated && !isRating && handleRating(star)}
                disabled={rated || isRating}
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
          <p className={styles.ratingText}>
            {rated ? "Thank you for your feedback!" : "Please Rate your Experience"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
