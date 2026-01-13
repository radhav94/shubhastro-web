import React from "react";
import "./Call.scss";
import { useCall } from "./Call.logic";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";

const Call = () => {
  const userId = localStorage.getItem("shubhtalk_customer_id");

  const navigate=useNavigate();
  const { data, isLoading, error } = useCall(userId);

  if (isLoading) {
    return <div className="call-history">Loading call history...</div>;
  }

  if (error) {
    return <div className="call-history">Failed to load call history</div>;
  }

  if (!data.length) {
    return <div className="call-history">No call history found</div>;
  }


  const handleCardClick = (roomId) => {
    navigate(
      PATH.privateRoutes.UserCallHistory.path
    );
  };

  return (
    <div className="call-history">
      {data.map((item) => (
        <div className="call-card" 
         key={item.id}
      onClick={() => handleCardClick(item.roomId)}
      style={{ cursor: "pointer" }}
        >
          
          {/* Top */}
          <div className="call-card__top">
            <span>Order Id: #{item.orderId}</span>
            <span className="help">HELP</span>
          </div>

          {/* Body */}
          <div className="call-card__body">
            {/* LEFT */}
            <div className="left">
              <img src={item.image} alt={item.name} />
              <span className="rate">₹ {item.rate}/min</span>
            </div>

            {/* RIGHT */}
            <div className="right">
              <h4>{item.name}</h4>
              <p className="date">{item.date}</p>
              <span className="status completed">Completed</span>
            </div>
          </div>

          {/* Meta */}
          <div className="call-card__meta">
            <div>
              <span>Duration</span>
              <strong>{item.duration} minutes</strong>
            </div>
            <div>
              <span>Deduction</span>
              <strong>₹ {item.deduction}</strong>
            </div>
          </div>

          <button className="call-btn">Call</button>
        </div>
      ))}
    </div>
  );
};

export default Call;
