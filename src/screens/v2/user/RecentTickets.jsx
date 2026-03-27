import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetMyTicketsQuery } from "../../../redux/api/supportApi/supportApi";
import styles from "./RecentTickets.module.scss";

const RecentTickets = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: ticketsData, isLoading } = useGetMyTicketsQuery({ page, limit: 10 });
  const tickets = ticketsData?.data?.tickets || ticketsData?.data || [];
  const pagination = ticketsData?.data?.pagination;

  const handleTicketClick = (ticket) => {
    navigate(`/recent-tickets/${ticket._id || ticket.id}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={styles.ticketsPage}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate("/profile", { state: { activeTab: "Support" } })}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>Recent Tickets</h1>
        </div>
      </header>

      <div className={styles.ticketsList}>
        {isLoading ? (
          <p className={styles.loadingText}>Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className={styles.emptyText}>No tickets found</p>
        ) : (
          tickets.map((ticket, index) => (
            <div
              key={ticket._id || `${ticket.id}-${index}`}
              className={styles.ticketCard}
              onClick={() => handleTicketClick(ticket)}
            >
              <div className={styles.ticketHeader}>
                <span className={styles.ticketId}>{ticket.ticketId}</span>
                <span
                  className={`${styles.statusBadge} ${
                    ticket.status === "resolved" || ticket.status === "closed"
                      ? styles.statusResolved
                      : styles.statusOngoing
                  }`}
                >
                  {ticket.status === "resolved" || ticket.status === "closed" ? "● Resolved" : "● " + ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </span>
              </div>
              <hr className={styles.ticketDivider} />

              <div className={styles.ticketMeta}>
                <span className={styles.ticketDate}>
                  {formatDate(ticket.createdAt)} • {formatTime(ticket.createdAt)}
                </span>
              </div>

              <div className={styles.ticketTopic}>
                <span className={styles.topicLabel}>Topic:</span>{" "}
                <span className={styles.topicText}>{ticket.topicName || ticket.topic}</span>
              </div>
            </div>
          ))
        )}

        {pagination?.hasNextPage && (
          <button className={styles.loadMoreButton} onClick={() => setPage((p) => p + 1)}>
            Load More
          </button>
        )}
      </div>
    </div>
  );
};

export default RecentTickets;
