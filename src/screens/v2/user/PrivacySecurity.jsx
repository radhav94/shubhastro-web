import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteAccount } from "../../../services/appServices/authService";
import { logout } from "../../../redux/auth/authSlice";
import { Toast } from "../../../component/index";
import DeleteConfirmationModal from "../../../component/UI/modal/deleteModal/DeleteConfirmationModal";
import styles from "./PrivacySecurity.module.scss";

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get the active tab from navigation state
  const { activeTab } = location.state || {};

  const handleBack = () => {
    if (activeTab) {
      // Navigate back to profile with the active tab state
      navigate("/profile", { state: { activeTab } });
    } else {
      // Fallback to browser back
      navigate(-1);
    }
  };

  const menuItems = [
    {
      id: 1,
      title: "Terms & Conditions",
      description: "Read our service terms and platform policies.",
      path: "/terms-and-conditions",
    },
    {
      id: 2,
      title: "Privacy Policies",
      description: "Read our service terms and platform policies.",
      path: "/privacy-policy",
    },
    {
      id: 3,
      title: "App License",
      description: "Read our service terms and platform policies.",
      path: "/app-license",
    },
  ];

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // await deleteAccount();
      Toast.success("Account deleted successfully");
      
      // Logout and clear all data
      // dispatch(logout());
      // localStorage.clear();
      // window.dispatchEvent(new Event("auth-change"));
      
      // Navigate to home
      // navigate("/");
    } catch (error) {
      console.error("Delete account error:", error);
      Toast.error(error?.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={handleBack}
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>Privacy and Security</h1>
        </div>
      </header>

      <div className={styles.content}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
          >
            <div className={styles.menuItemContent}>
              <h3 className={styles.menuItemTitle}>{item.title}</h3>
              <p className={styles.menuItemDescription}>{item.description}</p>
            </div>
            <ChevronRight size={20} className={styles.menuItemIcon} />
          </div>
        ))}

        <div
          className={`${styles.menuItem} ${styles.deleteMenuItem} ${styles.delteButton}`}
          onClick={() => setShowDeleteModal(true)}
        >
          <div className={styles.menuItemContent}>
            <h3 className={`${styles.menuItemTitle} ${styles.deleteTitle}`}>
              Delete Account
            </h3>
            {/* <p className={styles.menuItemDescription}>
              Permanently delete your account and all associated data.
            </p> */}
          </div>
          <ChevronRight size={20} className={styles.deleteIcon} />
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PrivacySecurity;
