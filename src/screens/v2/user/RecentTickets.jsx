import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./RecentTickets.module.scss";

const RecentTickets = () => {
  const navigate = useNavigate();

  // Sample ticket data
  const tickets = [
    {
      id: 1896,
      status: "ongoing",
      date: "Oct 01, 2025",
      time: "04:36 PM",
      topic: "Booking and Consultation",
    },
    {
      id: 1895,
      status: "resolved",
      date: "Oct 01, 2025",
      time: "04:36 PM",
      topic: "Booking and Consultation",
    },
    {
      id: 1896,
      status: "ongoing",
      date: "Oct 01, 2025",
      time: "04:36 PM",
      topic: "Booking and Consultation",
    },
    {
      id: 1896,
      status: "ongoing",
      date: "Oct 01, 2025",
      time: "04:36 PM",
      topic: "Booking and Consultation",
    },
    {
      id: 1890,
      status: "resolved",
      date: "Oct 01, 2025",
      time: "04:36 PM",
      topic: "Booking and Consultation",
    },
  ];

  const handleTicketClick = (ticket) => {
    // Navigate to ticket details
    navigate(`/recent-tickets/${ticket.id}`);
  };

  return (
    <div className={styles.ticketsPage}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>Recent Tickets</h1>
      </div>

      {/* Tickets List */}
      <div className={styles.ticketsList}>
        {tickets.map((ticket, index) => (
          <div
            key={`${ticket.id}-${index}`}
            className={styles.ticketCard}
            onClick={() => handleTicketClick(ticket)}
          >
            <div className={styles.ticketHeader}>
              <span className={styles.ticketId}>#{ticket.id}</span>
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

            <div className={styles.ticketMeta}>
              <span className={styles.ticketDate}>
                {ticket.date} • {ticket.time}
              </span>
            </div>

            <div className={styles.ticketTopic}>
              <span className={styles.topicLabel}>Topic:</span>{" "}
              <span className={styles.topicText}>{ticket.topic}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTickets;
