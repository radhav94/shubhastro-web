import { useCall } from "../../../../../context/CallContext";
import { useInitiateCall } from "../../../../../utils/hooks/useInitiateCall";

export const FooterMissedApproval = () => {
  const { setMissedApproval, lastRequestedAstro, lastCallType } = useCall();
  const { initiateCall } = useInitiateCall();

  const handleCallAgain = () => {
    setMissedApproval(false);
    if (lastRequestedAstro) {
      // Use the stored call type, fallback to "audio" if not available
      const callType = lastCallType || "audio";
      initiateCall(lastRequestedAstro, callType);
    }
  };

  return (
    <div className="flex items-center gap-3 text-white">
      <span className="text-xl">⚠️</span>
      <div>
        <p className="text-sm font-medium">Looks like you missed the notification</p>
        <p className="text-xs text-zinc-400">Do you want to call again?</p>
      </div>

      <button
        onClick={handleCallAgain}
        className="ml-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition"
      >
        Call Again
      </button>
    </div>
  );
};
