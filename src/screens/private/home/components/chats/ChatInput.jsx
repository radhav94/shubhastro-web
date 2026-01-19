import styles from "./ChatWindow.module.scss";
import { IoSendOutline, IoAttachOutline, IoMicOutline, IoCallSharp } from "react-icons/io5";
import { useState } from "react";
import KundliSelectModal from "../../../talkToAstrologer/kundliSelect/KundliSelectModal";
import toast from "../../../../../component/toast";
import { useChat } from "../../../../../context/ChatContext";
import { useVoiceRecorder } from "../../../talkToAstrologer/voiceChat/useVoiceRecorder";
import VoiceRecorderPopup from "../../../talkToAstrologer/voiceChat/VoiceRecorderPopup";
import { useFileSelector } from "./filePicker/useFileSelector";

const ChatInput = ({
  value,
  onChange,
  onSend,
  isMessageDisabled = false,
  onChatEnd,
  sendVoiceMessage,
  sendFiles,
}) => {
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);
    if (!kundli?._id) return toast.error("Kundli not selected properly");
    onSend(kundli);
  };

  const { setActiveChat } = useChat();

  const handleAttachClick = async () => {
    try {
      const { blob, name, type, size } = await openFileSelector(
        "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
      );

      await sendFiles(blob, { name, type, size });
    } catch (err) {
      console.log("File selection cancelled");
    }
  };

  const { recording, seconds, startRecording, stopRecording } =
    useVoiceRecorder();

  const { openFileSelector } = useFileSelector();

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
        <div className={styles.inputWrapper}>
          <input
            className={styles.inputField}
            value={value}
            onChange={onChange}
            disabled={isMessageDisabled}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="| Starts typing..."
          />
          
          <div className={styles.inputIcons}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleAttachClick}
            >
              <IoAttachOutline />
            </button>

            <button className={styles.iconButton} onClick={handleMicClick}>
              <IoMicOutline />
            </button>

            <button className={styles.sendButton} onClick={onSend}>
              <IoSendOutline />
            </button>
          </div>
        </div>

        <button className={styles.endCallButton} onClick={onChatEnd}>
          <IoCallSharp />
        </button>
      </div>
      
      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={handleChatAfterKundliSelect}
      />

      {recording && (
        <VoiceRecorderPopup seconds={seconds} onStop={handleStopRecording} />
      )}
    </>
  );
};

export default ChatInput;
