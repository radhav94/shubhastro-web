import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { createPortal } from "react-dom";
import { useLogoutDeviceMutation } from "../../../../redux/api/device/deviceApi";
import { logout } from "../../../../redux/auth/authSlice";
import Toast from "../../../toast";
import styles from "./DeviceLimitModal.module.scss";

const DeviceLimitModal = ({ isOpen, onClose, onDeviceUpdated, devices = [] }) => {
  const dispatch = useDispatch();
  const [logoutDevice] = useLogoutDeviceMutation();
  const [removingId, setRemovingId] = useState(null);

  /*
    Seq-keyed inline notice rather than a toast. This modal is centred and
    full-screen; the toaster is top-right and Clarity cannot see it either way, so
    a blocked tap needs an answer inside the dialog. The seq forces a re-render
    even when the same message repeats, so a second tap visibly re-announces.
  */
  const [notice, setNotice] = useState(null);
  const noticeSeq = useRef(0);
  const announce = useCallback((text) => {
    noticeSeq.current += 1;
    setNotice({ seq: noticeSeq.current, text });
  }, []);

  /*
    Escape closes, but only when the caller actually gave us an onClose — see the
    note on that prop below. Registered before the early return so hook order is
    stable across open/closed renders.
  */
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !devices.length) {
    console.log("🔕 DeviceLimitModal: isOpen =", isOpen, "devices.length =", devices.length);
    return null;
  }
  
  console.log("✅ DeviceLimitModal: RENDERING with", devices.length, "devices");

  const handleRemove = async (device_id) => {
    /*
      The guard lives here, not on the button, because the button no longer uses
      native `disabled`. Previously every Logout carried `disabled={isLoading}`,
      and isLoading is the shared mutation flag, so the first tap deadened every
      row at once — including the one just tapped. A disabled button dispatches no
      click event, so those taps were swallowed with nothing said and nothing for
      Clarity to attribute them to.
    */
    if (removingId !== null) {
      announce(
        removingId === device_id
          ? "Still logging that device out — one moment."
          : "Another device is already being logged out — one moment.",
      );
      return;
    }

    setNotice(null);
    setRemovingId(device_id);
    try {
      const response = await logoutDevice({ device_id }).unwrap();
      Toast.success("Device logged out successfully");
      
      // Check if device being removed is the current device
      // currentDevice: true means this is the device the user is currently on
      const deviceBeingRemoved = devices.find(d => d.device_id === device_id);
      const isCurrentDeviceRemoved = deviceBeingRemoved?.currentDevice;
      
      // Check if max_device_reached is now false (user can login)
      const maxDeviceReachedNow = response?.data?.max_device_reached;
      
      console.log("🔍 Device removal result:");
      console.log("  Device removed:", device_id);
      console.log("  Is current device:", isCurrentDeviceRemoved);
      console.log("  Device limit still active:", maxDeviceReachedNow);
      
      // If it's the current device being removed, perform full logout
      // This means user is logging out from THIS device, so complete logout
      if (isCurrentDeviceRemoved) {
        console.log("🔴 Current device logout - Full session clear");
        
        // Get the current page URL before clearing storage
        const currentPage = window.location.pathname + window.location.search;
        console.log("🔄 Storing current page for redirect after logout:", currentPage);
        
        // Dispatch Redux logout action to update state
        dispatch(logout());
        
        // Clear all storage except the redirect page info
        const redirectPage = currentPage;
        localStorage.clear();
        sessionStorage.clear();
        window.dispatchEvent(new Event("auth-change"));
        
        // Store redirect page in sessionStorage (cleared after redirect)
        sessionStorage.setItem("shubhtalk_redirect_after_logout", redirectPage);
        
        // Redirect to login immediately (no delay to prevent showing logged-in state)
        window.location.href = "/login";
        return;
      }
      
      // If max_device_reached is now false, allow user to proceed (auto-login)
      if (maxDeviceReachedNow === false) {
        console.log("✅ Device limit resolved - Proceeding");
        
        // Clear device limit popup
        localStorage.removeItem("shubhtalk_device_limit_reached");
        sessionStorage.removeItem("shubhtalk_device_limit_reached");
        
        // Close popup and proceed
        Toast.success("Device limit removed. Proceeding...");
        setTimeout(() => {
          // Refresh page to ensure clean state with updated device info
          window.location.reload();
        }, 500);
        return;
      }
      
      // Otherwise, other device logged out but limit still active
      // Current device stays logged in, just refresh page to update device list
      console.log("🟡 Other device logout - Current device stays, refreshing...");
      const updatedDevices = devices.filter(d => d.device_id !== device_id);
      
      // Notify parent wrapper about updated devices
      if (onDeviceUpdated) {
        onDeviceUpdated(updatedDevices);
      } else {
        // Fallback: directly update localStorage if callback not provided
        if (updatedDevices.length > 0) {
          localStorage.setItem("shubhtalk_device_limit_reached", JSON.stringify(updatedDevices));
        } else {
          localStorage.removeItem("shubhtalk_device_limit_reached");
        }
      }
      
      // Refresh page after a short delay to show the updated device list
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error("❌ Device logout failed:", error);
      Toast.error("Failed to logout device");
    } finally {
      setRemovingId(null);
    }
  };

  const formatDeviceInfo = (info) => {
    if (!info) return "Unknown device";
    const [label] = info.split("|");
    return label || info;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return createPortal(
    /*
      The overlay closes the dialog when the caller supplied onClose.

      This modal had no way out at all: no close control, no overlay dismiss, no
      Escape. It renders on /login the moment OTP verification reports the device
      limit, so a visitor who did not want to sign a device out had nothing to tap
      — every tap on the overlay or the dialog body was a dead click, on the
      signup critical path.

      onClose was not missing from the design. It is declared in this component's
      props and all three call sites pass a working handler
      (Onboarding.jsx, HomeLayout.jsx, GuestKundliAuthModal.jsx), and .closeBtn
      was already written in the stylesheet — the prop was simply never called and
      the button never rendered. So this wires up behaviour the callers already
      expect rather than inventing an escape hatch.

      Guarded on onClose so a caller that deliberately wants a hard wall still
      gets one instead of silently gaining a dismiss.
    */
    <div
      className={styles.overlay}
      onClick={onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deviceLimitTitle"
    >
      <div className={styles.modal}>
        <h3 className={styles.title} id="deviceLimitTitle">Device Limit Reached</h3>
        <p className={styles.subtitle}>
          You are logged in on the maximum number of devices. Remove a device to continue.
        </p>

        <div className={styles.deviceList}>
          {devices.map((device) => (
            <div key={device.device_id} className={styles.deviceItem}>
              <div className={styles.deviceInfo}>
                <span className={styles.deviceName}>
                  {formatDeviceInfo(device.deviceInfo)}
                  {device.currentDevice && <span className={styles.currentBadge}> (Current)</span>}
                </span>
                {device.date && <span className={styles.deviceDate}>{formatDate(device.date)}</span>}
              </div>
              {/* `aria-disabled`, never native `disabled` — see handleRemove.
                  aria-busy is scoped to the row actually being removed so the
                  spinner text does not appear on all of them at once. */}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => handleRemove(device.device_id)}
                aria-disabled={removingId !== null}
                aria-busy={removingId === device.device_id}
                title={device.currentDevice ? "Logging out this device will completely logout" : ""}
              >
                {removingId === device.device_id ? "..." : "Logout"}
              </button>
            </div>
          ))}
        </div>

        {notice && (
          <p key={notice.seq} className={styles.deviceLimitNotice} role="status" aria-live="polite">
            {notice.text}
          </p>
        )}

        {/* .closeBtn was already in the stylesheet and never rendered. */}
        {onClose && (
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            Not now
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default DeviceLimitModal;
