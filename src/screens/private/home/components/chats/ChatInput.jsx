import styles from "./ChatWindow.module.scss";
import toast from "../../../../../component/toast";
import { useState } from "react";
import KundliSelectModal from "../../../talkToAstrologer/kundliSelect/KundliSelectModal";
import { useChat } from "../../../../../context/ChatContext";
import { useVoiceRecorder } from "../../../talkToAstrologer/voiceChat/useVoiceRecorder";
import VoiceRecorderPopup from "../../../talkToAstrologer/voiceChat/VoiceRecorderPopup";
import { useFileSelector } from "./filePicker/useFileSelector";
import { IoCallSharp } from "react-icons/io5";

// Import SVG icons
import SendIcon from "../../../../../assets/chat/send.svg";
import AttachIcon from "../../../../../assets/chat/mingcute_attachment-line.svg";
import MicIcon from "../../../../../assets/chat/Microphone Icon.svg";

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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M9.17 0H2C0.9 0 0 0.9 0 2V18C0 19.1 0.9 20 2 20H14C15.1 20 16 19.1 16 18V6.83C16 6.3 15.79 5.79 15.41 5.42L10.58 0.59C10.21 0.21 9.7 0 9.17 0ZM12 13C12 15.34 9.99 17.21 7.61 16.98C5.53 16.78 4 14.92 4 12.83V7.64C4 6.33 4.94 5.14 6.24 5.01C7.74 4.86 9 6.03 9 7.5V12C9 12.55 8.55 13 8 13C7.45 13 7 12.55 7 12V7.5C7 7.22 6.78 7 6.5 7C6.22 7 6 7.22 6 7.5V12.89C6 13.89 6.68 14.81 7.66 14.97C8.92 15.18 10 14.21 10 13V10C10 9.45 10.45 9 11 9C11.55 9 12 9.45 12 10V13ZM10 5V2L14 6H11C10.45 6 10 5.55 10 5Z" fill="url(#paint0_linear_8989_193)"/>
                <defs>
                  <linearGradient id="paint0_linear_8989_193" x1="0" y1="10" x2="16" y2="10" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#F75801"/>
                    <stop offset="1" stop-color="#D43400"/>
                  </linearGradient>
                </defs>
              </svg>
            </button>

            <button className={styles.iconButton} onClick={handleMicClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11V5Z" fill="url(#paint0_linear_8947_1547)"/>
                <path d="M7 11C7 10.4477 6.55228 10 6 10C5.44772 10 5 10.4477 5 11C5 14.5265 7.60771 17.4439 11 17.9291V20H9C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22H15C15.5523 22 16 21.5523 16 21C16 20.4477 15.5523 20 15 20H13V17.9291C16.3923 17.4439 19 14.5265 19 11C19 10.4477 18.5523 10 18 10C17.4477 10 17 10.4477 17 11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11Z" fill="url(#paint1_linear_8947_1547)"/>
                <defs>
                  <linearGradient id="paint0_linear_8947_1547" x1="5" y1="12" x2="19" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#F75801"/>
                    <stop offset="1" stop-color="#D43400"/>
                  </linearGradient>
                  <linearGradient id="paint1_linear_8947_1547" x1="5" y1="12" x2="19" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#F75801"/>
                    <stop offset="1" stop-color="#D43400"/>
                  </linearGradient>
                </defs>
              </svg>
            </button>

            <button className={styles.sendButton} onClick={onSend}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 20 17" fill="none">
                <path d="M1.4 16.8849L18.85 9.40488C19.66 9.05488 19.66 7.91488 18.85 7.56488L1.4 0.0848801C0.74 -0.20512 0.00999999 0.28488 0.00999999 0.99488L0 5.60488C0 6.10488 0.37 6.53488 0.87 6.59488L15 8.48488L0.87 10.3649C0.37 10.4349 0 10.8649 0 11.3649L0.00999999 15.9749C0.00999999 16.6849 0.74 17.1749 1.4 16.8849Z" fill="#FEFEFE"/>
              </svg>
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
