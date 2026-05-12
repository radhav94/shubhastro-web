import { useNavigate } from "react-router-dom";
import { useChat } from "../../../../../context/ChatContext";

export const FooterMissedApproval = () => {
  const { setMissedApproval, lastRequestedAstro } = useChat();
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 text-white">
      <span className="text-xl">⚠️</span>
      <div>
        <p className="text-sm font-medium">Looks like you missed the notification</p>
        <p className="text-xs text-zinc-400">Do you want to chat again?</p>
      </div>

      <button
        onClick={() => {
          setMissedApproval(false);
            navigate(`/chat-to-astrologer/`, {
                state: { rejoinAstro: lastRequestedAstro }
            })
        }}
        className="ml-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition"
      >
        Chat Again
      </button>
    </div>
  );
};
