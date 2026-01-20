import React from "react";
import "./Chat.scss";
import { useChat } from "./Chat.logic";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";


const Chat = () => {
  const userId = localStorage.getItem("shubhtalk_customer_id");

  const { data, isLoading, error } = useChat(userId);

  const navigate=useNavigate();



  if (isLoading) {
    return <div className="chat-history">Loading chat history...</div>;
  }

  if (error) {
    return <div className="chat-history">Failed to load chat history</div>;
  }

  if (!data.length) {
    return <div className="chat-history">No chat history found</div>;
  }


const handleCardClick = (roomId) => {
  navigate(
    PATH.privateRoutes.UserChatHistory.path.replace(":roomId", roomId)
  );
};



  return (
    <div className="chat-history">
      {data.map((item) => (
        <div
      className="chat-card"
      key={item.id}
      onClick={() => handleCardClick(item.roomId)}
      style={{ cursor: "pointer" }}
    >
          <div className="chat-card__top">
            <span>Order Id: #{item.orderId}</span>
            <span className="help">HELP</span>
          </div>
          <div className="chat-card__body">
            <div className="left">
              <img src={item.image} alt={item.name} />
              <span className="rate">₹ {item.rate}/min</span>
            </div>
            <div className="right">
              <h4>{item.name}</h4>
              <p className="date">{item.date}</p>
              <span className={`status ${item.status}`}>
                {item.status}
              </span>
            </div>
          </div>
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
