import { Pause, Volume2 } from "lucide-react";
import useTTS from "../../utils/hooks/useTTS";

const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#fff",
  color: "#F75801",
  cursor: "pointer",
  transition: "all 0.2s",
  flexShrink: 0,
  minWidth: "30px",
  minHeight: "30px",
};

const TTSButton = ({ text, size = 16 }) => {
  const { speak, stop, isSpeaking } = useTTS();

  if (!text) return null;

  return (
    <button
      style={btnStyle}
      onClick={() => (isSpeaking ? stop() : speak(text))}
      aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
      type="button"
    >
      {isSpeaking ? <Pause size={size} /> : <Volume2 size={size} />}
    </button>
  );
};

export default TTSButton;
