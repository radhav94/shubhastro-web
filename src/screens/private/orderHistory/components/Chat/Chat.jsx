import React from "react";
import "./Chat.scss";
import { useChat } from "./Chat.logic";

const Chat = () => {
  const userId = localStorage.getItem("shubhtalk_customer_id");



  console.log("userId------>>>>",userId);

  const { data, isLoading, error } = useChat(userId);

  if (isLoading) {
    return <div className="chat-history">Loading chat history...</div>;
  }

  if (error) {
    return <div className="chat-history">Failed to load chat history</div>;
  }

  if (!data.length) {
    return <div className="chat-history">No chat history found</div>;
  }

  return (
    <div className="chat-history">
      {data.map((item) => (
        <div className="chat-card" key={item.id}>
          {/* Top */}
          <div className="chat-card__top">
            <span>Order Id: #{item.orderId}</span>
            <span className="help">HELP</span>
          </div>

          {/* Body */}
          <div className="chat-card__body">
            {/* LEFT */}
            <div className="left">
              <img src={item.image} alt={item.name} />
              <span className="rate">₹ {item.rate}/min</span>
            </div>

            {/* RIGHT */}
            <div className="right">
              <h4>{item.name}</h4>
              <p className="date">{item.date}</p>
              <span className={`status ${item.status}`}>
                {item.status}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="chat-card__meta">
            <div>
              <span>Messages</span>
              <strong>{item.messages}</strong>
            </div>
            <div>
              <span>Deduction</span>
              <strong>₹ {item.deduction}</strong>
            </div>
          </div>

          <button className="chat-btn">Chat</button>
        </div>
      ))}
    </div>
  );
};

export default Chat;
