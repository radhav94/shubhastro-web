import "./CallRequestPopup.scss";
import { getAstrologerDisplayName } from "../../../../../utils/helper/string.utils";

const CallRequestPopup = ({ show, onClose, onJoinAudio, onJoinVideo, host, astrologer, waitingList }) => {
  if (!show) return null;

  // Mock waitlist data
  const waitlist = [
    { id: 1, name: "Swati Kumar", time: "4:35 PM", duration: "10m" },
    { id: 2, name: "Dev Kumar", time: "4:35 PM", duration: "10m" },
    { id: 3, name: "Swati Kumar", time: "4:35 PM", duration: "10m" },
  ];

  const waitTime = waitingList || 35; // minutes

  // Get rate from astrologer data or use default
  const audioRate = astrologer?.audioCallRate || host?.rate || 20;
  const videoRate = astrologer?.videoCallRate || host?.rate || 20;
  const astrologerName = astrologer?.astrologerName || getAstrologerDisplayName(astrologer) || host?.name || "Astrologer";

  return (
    <div className="call-overlay" onClick={onClose}>
      <div className="call-popup" onClick={(e) => e.stopPropagation()}>
        
        {/* Handle bar */}
        <div className="popup-handle"></div>

        {/* Title */}
        <h2 className="popup-title">Call {astrologerName}</h2>

        {/* Waitlist Items */}
        <div className="waitlist-container">
          {waitlist.map((person) => (
            <div key={person.id} className="waitlist-item">
              <div className="waitlist-info">
                <div className="waitlist-name">{person.name}</div>
                <div className="waitlist-time">Time of Consultation : {person.time}</div>
              </div>
              <div className="waitlist-duration">{person.duration}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="popup-divider"></div>

        {/* Join Waitlist Section */}
        <div className="join-section">
          <h3 className="join-title">Join Waitlist</h3>
          <div className="wait-time">
            Wait Time : <span className="wait-time-value">{waitTime} min</span>
          </div>
        </div>

        {/* Call Buttons */}
        <div className="call-buttons">
          <button className="call-btn voice-call" onClick={onJoinAudio}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/>
            </svg>
            <span>₹{audioRate}/ min</span>
          </button>

          <button className="call-btn video-call" onClick={onJoinVideo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <span>₹{videoRate}/ min</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CallRequestPopup;
