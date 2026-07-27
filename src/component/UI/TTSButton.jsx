import { useEffect, useRef } from "react";
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
  width: "32px",
  height: "32px",
  minWidth: "32px",
  minHeight: "32px",
  // iOS Safari applies native button rendering that offsets the icon and
  // breaks alignment — reset it so the icon stays perfectly centered.
  WebkitAppearance: "none",
  appearance: "none",
  boxSizing: "border-box",
  lineHeight: 0,
  margin: 0,
  verticalAlign: "middle",
};

const TTSButton = ({ text, size = 16 }) => {
  const { speak, stop, isSpeaking, isLoading } = useTTS();
  const prevTextRef = useRef(text);

  // Stop TTS when text changes (e.g. tab switch)
  useEffect(() => {
    if (prevTextRef.current !== text) {
      stop();
      prevTextRef.current = text;
    }
  }, [text, stop]);

  if (!text) return null;

  const getIcon = () => {
    if (isLoading) return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
    if (isSpeaking) return <Pause size={size} />;
    return <Volume2 size={size} />;
  };

  const handleClick = () => {
    if (isLoading || isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  return (
    <button
      style={btnStyle}
      className="notranslate"
      onClick={handleClick}
      aria-label={isLoading ? "Loading speech" : isSpeaking ? "Stop reading" : "Read aloud"}
      type="button"
    >
      {getIcon()}
    </button>
  );
};

export default TTSButton;
