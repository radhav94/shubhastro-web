import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useGetRoomChatMessagesQuery } from "../../../../../redux/api/chatHistory/chatHistory";
import { useAddAstrologerReviewMutation } from "../../../../../redux/api/review/reviewApi";
// import Feedback from "../../../../../components/Feedback/Feedback"; // ✅ path adjust if needed
import "./SingleChat.scss";
import Feedback from "../../../home/components/chats/Feedback";

const SingleChatHistory = () => {
  const { roomId } = useParams();

  const { data, isLoading, error } =
    useGetRoomChatMessagesQuery(roomId);

  const chatData = data?.data?.[0];
  const messages = chatData?.chatHistory || [];
  const astrologerId = chatData?.astrologerId;

  // 🔹 Feedback modal state
  const [openFeedback, setOpenFeedback] = useState(false);

  // 🔹 Review mutation
  const [addReview, { isLoading: reviewLoading }] =
    useAddAstrologerReviewMutation();

  // 🔹 Review submit handler
  const handleReviewSubmit = async ({ rating, review, isAnonymous }) => {
    const payload = {
      astrologerID: astrologerId,
      rating,
      review,
      isAnonymous,
    };

    try {
      await addReview(payload).unwrap();
      setOpenFeedback(false);
      alert("Review submitted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to submit review");
    }
  };

  if (isLoading) return <div className="chat-state">Loading chat…</div>;
  if (error) return <div className="chat-state error">Failed to load chat</div>;
  if (!messages.length)
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

        {/* ===== Chat Body ===== */}
        <div className="chat-container">
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
          ratedUserName={astrologerId}      // abhi ID, baad me name
          reviewerName={"User"}             // ya user?.firstName
          loading={reviewLoading}
        />

      </div>
    </div>
  );
};

export default SingleChatHistory;
