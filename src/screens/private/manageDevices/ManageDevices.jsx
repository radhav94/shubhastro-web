import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ManageDevices.module.scss";
import { useGetActiveSessionsQuery, useLogoutDeviceMutation } from "../../../redux/api/device/deviceApi";
import Toast from "../../../component/toast";
import BackButton from "../../../component/UI/BackButton/BackButton";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { IoPhonePortraitOutline, IoLaptopOutline, IoTabletPortraitOutline } from "react-icons/io5";

const ManageDevices = () => {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useGetActiveSessionsQuery();
  const [logoutDevice] = useLogoutDeviceMutation();
  const [removingId, setRemovingId] = useState(null);

  const devices = data?.data || [];

  const handleLogout = async (device_id) => {
    console.log('device_id :>> ', device_id);
    setRemovingId(device_id);
    try {
      await logoutDevice({ device_id }).unwrap();
      Toast.success("Device logged out successfully");
      refetch();
    } catch {
      Toast.error("Failed to logout device");
    } finally {
      setRemovingId(null);
    }
  };

  const getDeviceIcon = (info) => {
    if (!info) return <IoLaptopOutline size={24} />;
    const lower = info.toLowerCase();
    if (lower.includes("iphone") || lower.includes("android") || lower.includes("mobile")) return <IoPhonePortraitOutline size={24} />;
    if (lower.includes("ipad") || lower.includes("tablet")) return <IoTabletPortraitOutline size={24} />;
    return <IoLaptopOutline size={24} />;
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

  return (
    <>
      <BackButton />
      <div className={styles.container}>
        {isLoading && <PrimaryLoader />}

        <div className={styles.header}>
          <h1 className={styles.title}>Manage Devices</h1>
          <p className={styles.subtitle}>
            You can be logged in on up to 2 devices. Remove devices you no longer use.
          </p>
        </div>

        <div className={styles.deviceList}>
          {devices.length === 0 && !isLoading && (
            <p className={styles.empty}>No active sessions found.</p>
          )}
          {devices.map((device) => (
            <div key={device.device_id} className={`${styles.deviceCard} ${device.currentDevice ? styles.current : ""}`}>
              <div className={styles.deviceIcon}>
                {getDeviceIcon(device.deviceInfo)}
              </div>
              <div className={styles.deviceDetails}>
                <span className={styles.deviceName}>
                  {formatDeviceInfo(device.deviceInfo)}
                  {device.currentDevice && <span className={styles.currentBadge}>This device</span>}
                </span>
                {device.date && <span className={styles.deviceDate}>Last active: {formatDate(device.date)}</span>}
              </div>
              {!device.currentDevice && (
                <button
                  className={styles.logoutBtn}
                  onClick={() => handleLogout(device.device_id)}
                  disabled={removingId === device.device_id}
                >
                  {removingId === device.device_id ? "..." : "Logout"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ManageDevices;
