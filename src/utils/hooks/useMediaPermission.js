import { useCallback } from "react";

/**
 * Hook to check media permissions (mic/camera) before initiating calls.
 * On denial, dispatches a global "permission:denied" event picked up by PermissionModalProvider.
 */
export const useMediaPermission = () => {
  /**
   * Check if the given permission(s) are available.
   * @param {"microphone"|"camera"|"both"} type
   * @returns {Promise<boolean>} true if permission granted, false if denied (modal auto-shown)
   */
  const checkPermission = useCallback(async (type = "microphone") => {
    try {
      const constraints = {};
      if (type === "microphone" || type === "both") constraints.audio = true;
      if (type === "camera" || type === "both") constraints.video = true;

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.warn(`[useMediaPermission] ${type} denied:`, err.name);
      window.dispatchEvent(new CustomEvent("permission:denied", { detail: { type } }));
      return false;
    }
  }, []);

  return { checkPermission };
};
