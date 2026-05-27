import { useState, useEffect } from "react";
import PermissionModal from "./PermissionModal";

/**
 * Global provider that listens for "permission:denied" events
 * and renders the PermissionModal. Place this once at the app root.
 */
const PermissionModalProvider = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("microphone");

  useEffect(() => {
    const handleDenied = (e) => {
      setType(e.detail?.type || "microphone");
      setIsOpen(true);
    };

    const handleDismissed = () => {
      setIsOpen(false);
    };

    window.addEventListener("permission:denied", handleDenied);
    window.addEventListener("permission:dismissed", handleDismissed);

    return () => {
      window.removeEventListener("permission:denied", handleDenied);
      window.removeEventListener("permission:dismissed", handleDismissed);
    };
  }, []);

  return (
    <PermissionModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      type={type}
    />
  );
};

export default PermissionModalProvider;
