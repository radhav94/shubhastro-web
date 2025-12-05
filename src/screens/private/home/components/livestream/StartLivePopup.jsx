// src/components/LiveStreaming/StartLivePopup.jsx
import "./styles/popup.scss";

const StartLivePopup = ({ onStart }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2>Go Live 🔮</h2>
        <p>Start your astrology live session and connect with your audience.</p>

        <button className="start-btn" onClick={onStart}>
          Start Live Session 🚀
        </button>
      </div>
    </div>
  );
};

export default StartLivePopup;
