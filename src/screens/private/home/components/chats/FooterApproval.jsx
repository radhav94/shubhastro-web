import { useChat } from "../../../../../context/ChatContext";
import { voiceSocket } from "../../../../../services/voiceSocketServices";


export const FooterApproval = () => {
  const { resetChatFlow, activeChatRoomId } = useChat();

  const handleUserChatAcccept = () => {
    voiceSocket.emit("chat:accept", {roomId : activeChatRoomId, acceptedBy : "CUSTOMER"});
    resetChatFlow();
  }

  return (
    <>
      <div className="flex items-center gap-3 text-white">
        <span className="text-xl">✨</span>
        <div>
          <p className="text-sm font-medium">Astrologer accepted</p>
          <p className="text-xs text-zinc-400">Start chat now?</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleUserChatAcccept}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition"
        >
          Yes
        </button>
        <button
          onClick={() => {
            voiceSocket.emit("chat:cancel", {roomId : activeChatRoomId, canceledBy : "CUSTOMER"});
            resetChatFlow();
          }}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition"
        >
          No
        </button>
      </div>
    </>
  );
};
