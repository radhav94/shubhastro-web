import styles from "./ChatWindow.module.scss";
import { IoSend, IoAttach } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { GrReactjs } from "react-icons/gr";
import { useRef, useState } from "react";
import KundliSelectModal from "../../../talkToAstrologer/kundliSelect/KundliSelectModal";
import toast from "../../../../../component/toast";
import { useChat } from "../../../../../context/ChatContext";

const ChatInput = ({ value, onChange, onSend, isMessageDisabled=false, onChatEnd }) => {
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);
    if (!kundli?._id) return toast.error("Kundli not selected properly");
    onSend(kundli);
  };

  const {setActiveChat} = useChat();

  const fileInputRef = useRef(null);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    // console.log("Selected files:", files);
  };

  const handleChatEnd = () => {
    onChatEnd();
    setActiveChat(null);
  }

  return (
    <>
      <div className={styles.inputBox}>
        <>
          <button
            type="button"
            className={styles.attachButton}
            onClick={handleAttachClick}
          >
            <IoAttach size={20} />
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </>

        <button
          onClick={() => setKundliModalOpen(true)}
          className={styles.kundliButton}
        >
          <GrReactjs size={20} />
        </button>

        <input
          className={styles.inputField}
          value={value}
          onChange={onChange}
          disabled={isMessageDisabled}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Write a message..."
        />

        <button className={styles.sendButton} onClick={onSend}>
          <IoSend size={20} />
        </button>
        <button className={styles.endChatButton} onClick={handleChatEnd}>
          End
        </button>
      </div>
      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={handleChatAfterKundliSelect}
      />
    </>
  );
};

export default ChatInput;
