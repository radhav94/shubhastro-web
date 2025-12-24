import styles from "./ChatWindow.module.scss";
import { IoSend, IoAttach, IoMic } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { useState } from "react";
import KundliSelectModal from "../../../talkToAstrologer/kundliSelect/KundliSelectModal";
import { useVoiceRecorder } from "../../../talkToAstrologer/voiceChat/useVoiceRecorder";
import VoiceRecorderPopup from "../../../talkToAstrologer/voiceChat/VoiceRecorderPopup";

const ChatInput = ({ value, onChange, onSend, setOpen, sendVoiceMessage }) => {
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);
    if (!kundli?._id) return Toast.error("Kundli not selected properly");
    // const astro = selectedAstrologer;
    // localStorage.setItem("selectedAstroId", astro._id);
    onSend(kundli);
    console.log("Selected Kundli for chat:", kundli);
  };

  const {
    recording,
    seconds,
    startRecording,
    stopRecording,
  } = useVoiceRecorder();

  const handleMicClick = async () => {
    await startRecording();
  };

  const handleStopRecording = async () => {
    const { blob, duration } = await stopRecording();
    await sendVoiceMessage(blob, duration);
  };


  return (
    <>
      <div className={styles.inputBox}>
        <button className={styles.attachButton}>
          <IoAttach size={20} />
        </button>
        <button
          onClick={() => setKundliModalOpen(true)}
          className={styles.kundliButton}
        >
          <IoMdAdd size={20} />
        </button>

        <input
          className={styles.inputField}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Write a message..."
        />

        <button className={styles.sendButton} onClick={onSend}>
          <IoSend size={20} />
        </button>
        <button
          className={styles.voiceChatButton}
          onClick={handleMicClick}
        >
          <IoMic size={20} />
        </button>

        <button className={styles.endChatButton} onClick={() => setOpen(true)}>
          End
        </button>
      </div>
      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={handleChatAfterKundliSelect}
      />

      {recording && (
        <VoiceRecorderPopup
          seconds={seconds}
          onStop={handleStopRecording}
        />
      )}
    </>
  );
};

export default ChatInput;
