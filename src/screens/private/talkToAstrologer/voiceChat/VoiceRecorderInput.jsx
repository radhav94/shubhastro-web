import { useVoiceRecorder } from "./useVoiceRecorder";

const VoiceRecorderInput = ({ sendVoiceMessage }) => {
  const {
    recording,
    seconds,
    startRecording,
    stopRecording,
  } = useVoiceRecorder();

  const handleMicClick = async () => {
    if (!recording) {
      await startRecording();
    } else {
      const blob = await stopRecording();
      sendVoiceMessage(blob, seconds);
    }
  };

  return (
    <div className="inputBox">
      <button
        className={`micBtn ${recording ? "recording" : ""}`}
        onClick={handleMicClick}
      >
        {recording ? "⏹️" : "🎤"}
      </button>

      {recording && <span className="timer">{seconds}s</span>}
    </div>
  );
};

export default VoiceRecorderInput;
