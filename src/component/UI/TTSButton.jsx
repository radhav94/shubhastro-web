import { Loader2, Pause, Volume2 } from "lucide-react";
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
  const { speak, stop, isSpeaking, isLoading } = useTTS();

  if (!text) return null;

  const getIcon = () => {
    if (isLoading) return <Loader2 size={size} className="animate-spin" />;
    if (isSpeaking) return <Pause size={size} />;
    return <Volume2 size={size} />;
  };

  return (
    <button
      style={btnStyle}
      onClick={() => (isSpeaking || isLoading ? stop() : speak(text))}
      aria-label={isLoading ? "Loading speech" : isSpeaking ? "Stop reading" : "Read aloud"}
      type="button"
      disabled={isLoading}
    >
      {getIcon()}
    </button>
  );
};

export default TTSButton;
