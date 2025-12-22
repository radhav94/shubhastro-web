import styles from "./ChatWindow.module.scss";
import { IoSend, IoAttach } from "react-icons/io5";

const ChatInput = ({ value, onChange, onSend, setOpen }) => {
  return (
    <div className={styles.inputBox}>
      <button className={styles.attachButton}>
        <IoAttach size={20} />
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
  );
};

export default ChatInput;
