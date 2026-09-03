import React, { useState, useRef, useLayoutEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useGetRoomChatMessagesQuery } from "../../../../../redux/api/chatHistory/chatHistory";
import { useAddAstrologerReviewMutation } from "../../../../../redux/api/review/reviewApi";
// import Feedback from "../../../../../components/Feedback/Feedback"; // ✅ path adjust if needed
import "./SingleChat.scss";
import Feedback from "../../../home/components/chats/Feedback";

const SingleChatHistory = () => {
  const { roomId } = useParams();
  const [page, setPage] = useState(1);
  const containerRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const prevScrollHeightRef = useRef(null);
  const initialScrollDoneRef = useRef(false);

  const { data, isFetching } = useGetRoomChatMessagesQuery(
    { roomId, page },
    { skip: !roomId }
  );

  const chatData = data?.data?.[0];
  const messages = chatData?.chatHistory || [];
  const astrologerId = chatData?.astrologerId;
  const pagination = data?.pagination || {};
  const hasMore = pagination.hasNextPage ?? (page < (pagination.totalPages || 1));

  // Scroll to bottom on initial load
  useLayoutEffect(() => {
    if (initialScrollDoneRef.current) return;
    if (messages.length > 0 && !isFetching) {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        initialScrollDoneRef.current = true;
      }
    }
  }, [messages, isFetching]);

  // Restore scroll position after older messages are prepended
  useLayoutEffect(() => {
    if (!isLoadingMoreRef.current || !prevScrollHeightRef.current) return;
    if (isFetching) return;

    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
      isLoadingMoreRef.current = false;
    }
  }, [messages, isFetching]);

  // Scroll handler — load older messages when near top
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoadingMoreRef.current || isFetching || !hasMore) return;
    if (containerRef.current.scrollTop < 80) {
      isLoadingMoreRef.current = true;
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
      setPage((prev) => prev + 1);
    }
  }, [isFetching, hasMore]);

  // Feedback modal state
  const [openFeedback, setOpenFeedback] = useState(false);

  // 🔹 Review mutation
  const [addReview, { isLoading: reviewLoading }] =
    useAddAstrologerReviewMutation();

  /*
    🔹 Review submit handler

    Returns false on failure so FeedbackModal keeps the rating and the review
    text. Without that the handler returned `undefined`, which the modal reads as
    success and responds to by running resetForm() — so a failed post cleared
    everything the visitor had written while leaving the modal open, i.e. an
    empty form and no explanation of what to do with it.

    Same fix, and the same reasoning, as StickyReview.jsx (the reference
    implementation) and ChatWindow.jsx.
  */
  const handleReviewSubmit = async ({ rating, review, isAnonymous }) => {
    const payload = {
      astrologerID: astrologerId,
      rating,
      review,
      isAnonymous,
      roomId,
    };

    try {
      await addReview(payload).unwrap();
      setOpenFeedback(false);
      alert("Review submitted successfully");
      return true;
    } catch (err) {
      console.error(err);
      alert("Failed to submit review");
      return false;
    }
  };

  if (isFetching && page === 1) return <div className="chat-state">Loading chat…</div>;
  if (!messages.length && !isFetching)
    return <div className="chat-state">No messages</div>;

  return (
    <div className="chat-page">
      <div className="chat-wrapper">

        {/* ===== Chat Header ===== */}
        <div className="chat-header">
          <div className="chat-header__left">
            <div className="avatar">
              {astrologerId?.slice(-2)}
            </div>
            <div className="header-info">
              <h4 className="name">Astrologer ID</h4>
              <span className="sub">{astrologerId}</span>
            </div>
          </div>

          {/* Review button */}
          <button
    className="give-review-btn"
    onClick={() => setOpenFeedback(true)}
  >
    ⭐ Give Review
  </button>
        </div>

        {/* Chat Body */}
        <div className="chat-container" ref={containerRef} onScroll={handleScroll}>
          {isFetching && page > 1 && (
            <div className="chat-loading-more">Loading older messages...</div>
          )}
          {messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <div
                key={msg._id}
                className={`chat-row ${isUser ? "right" : "left"}`}
              >
                <div
                  className={`chat-bubble ${
                    isUser ? "user" : "astrologer"
                  }`}
                >
                  <p className="chat-text">{msg.message}</p>
                  <span className="chat-time">
                    {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== Feedback Modal ===== */}
        <Feedback
          open={openFeedback}
          onClose={() => setOpenFeedback(false)}
          handleSubmit={handleReviewSubmit}
          ratedUserName={astrologerId}
          reviewerName={"User"}
          loading={reviewLoading}
        />

      </div>
    </div>
  );
};

export default SingleChatHistory;
