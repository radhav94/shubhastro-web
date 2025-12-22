import styles from "./ChatWindow.module.scss";
import { IoSend, IoAttach } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { useState } from "react";
import KundliSelectModal from "../../../talkToAstrologer/kundliSelect/KundliSelectModal";

const ChatInput = ({ value, onChange, onSend, setOpen }) => {
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);
    if (!kundli?._id) return Toast.error("Kundli not selected properly");
    // const astro = selectedAstrologer;
    // localStorage.setItem("selectedAstroId", astro._id);
    onSend(kundli);
    console.log("Selected Kundli for chat:", kundli);
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
        <button className={styles.endChatButton} onClick={() => setOpen(true)}>
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
