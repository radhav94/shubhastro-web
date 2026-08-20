import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

export const useLiveViewLogic = (props) => {
  const {
    chatInput,
    setChatInput,
    sendChatMessage,
    messages,
    remoteUsers,
  } = props;

  const messagesEndRef = useRef(null);
  // Attached to the chat field so a send with an empty box can focus it.
  const inputRef = useRef(null);
  const [showSharePopup, setShowSharePopup] = useState(false);

  // Build share URL using the channel (not astrologerId) so the recipient
  // lands directly on the correct Agora stream.
  const channel = props.channel || "";
  const shareUrl = channel
    ? `${window.location.origin}/live/${channel}`
    : `${window.location.origin}/live`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    /*
      Tapping the send arrow with nothing typed used to fall through this guard
      into silence. The box being empty explains itself, but the tap should still
      land somewhere — put the cursor in the field so the next keystroke works.
    */
    if (!chatInput.trim()) {
      inputRef.current?.focus();
      return false;
    }
    // sendChatMessage reports false (and explains why via a toast) when the
    // socket is down, the room has not been joined, or the viewer is blocked.
    return sendChatMessage();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied");
    setShowSharePopup(false);
  };

  const shareToWhatsapp = () => {
    const msg = encodeURIComponent("Join Live 🔮 " + shareUrl);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
    setShowSharePopup(false);
  };

  const shareToGmail = () => {
    window.open(`mailto:?subject=Join Live&body=${shareUrl}`, "_blank");
    setShowSharePopup(false);
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      "_blank"
    );
    setShowSharePopup(false);
  };

  const shareToPinterest = () => {
    window.open(
      `https://pinterest.com/pin/create/button/?url=${shareUrl}`,
      "_blank"
    );
    setShowSharePopup(false);
  };

  return {
    messagesEndRef,
    inputRef,
    showSharePopup, setShowSharePopup,
    shareUrl,
    handleSend,
    handleCopyLink,
    shareToWhatsapp,
    shareToGmail,
    shareToFacebook,
    shareToPinterest,
  };
};
