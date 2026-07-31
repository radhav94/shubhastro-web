import { useState } from "react";
import { createPortal } from "react-dom";
import { useLogoutDeviceMutation } from "../../../../redux/api/device/deviceApi";
import Toast from "../../../toast";
import styles from "./DeviceLimitModal.module.scss";

const DeviceLimitModal = ({ isOpen, onClose, devices = [] }) => {
  const [logoutDevice, { isLoading }] = useLogoutDeviceMutation();
  const [removingId, setRemovingId] = useState(null);

  if (!isOpen || !devices.length) return null;

  const handleRemove = async (device_id) => {
    setRemovingId(device_id);
    try {
      await logoutDevice({ device_id }).unwrap();
      Toast.success("Device logged out successfully");
      onClose();
    } catch {
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Device Limit Reached</h3>
        <p className={styles.subtitle}>
          You are logged in on the maximum number of devices. Remove a device to continue.
        </p>

        <div className={styles.deviceList}>
          {devices.map((device) => (
            <div key={device.device_id} className={styles.deviceItem}>
              <div className={styles.deviceInfo}>
                <span className={styles.deviceName}>{formatDeviceInfo(device.deviceInfo)}</span>
                {device.date && <span className={styles.deviceDate}>{formatDate(device.date)}</span>}
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(device.device_id)}
                disabled={isLoading}
              >
                {removingId === device.device_id ? "..." : "Logout"}
              </button>
            </div>
          ))}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Continue without removing
        </button>
      </div>
    </div>,
    document.body
  );
};

export default DeviceLimitModal;
