import React from "react";
import "./CallRequestPopup.scss";

const CallRequestPopup = ({ show, onClose, onJoin, host }) => {
  if (!show) return null;

  return (
    <div className="call-overlay" onClick={onClose}>
      <div className="call-popup" onClick={(e) => e.stopPropagation()}>
        
        {/* Profile Section */}
        <div className="call-profile">
          <div className="avatar">
            <img src={host.image} alt="host" />
          </div>

          <div className="host-name">{host.name}</div>

          <button className="close-btn" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* Call Details */}
        <div className="call-info">
          <div className="call-price">
            📞 Private Audio Call @ ₹ {host.rate}/min
          </div>
          <div className="call-subtext">
            No one else can hear your conversation.
          </div>
        </div>

        <button className="call-join-btn" onClick={onJoin}>
          Join
        </button>

      </div>
    </div>
  );
};

export default CallRequestPopup;
