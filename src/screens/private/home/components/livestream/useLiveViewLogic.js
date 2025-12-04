import { useState, useEffect, useRef } from "react";

export const useLiveViewLogic = (props) => {
  const {
    chatInput,
    setChatInput,
    sendChatMessage,
    messages,
    remoteUsers,
  } = props;

  const messagesEndRef = useRef(null);
  const [showSharePopup, setShowSharePopup] = useState(false);

  const shareUrl = window.location.href;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    alert("Copied!");
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
    showSharePopup, setShowSharePopup,
    handleSend,
    handleCopyLink,
    shareToWhatsapp,
    shareToGmail,
    shareToFacebook,
    shareToPinterest,
  };
};
