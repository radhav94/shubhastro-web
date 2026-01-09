import React, { useState } from "react";
import styles from "./SavedKundliList.module.scss";
import { IoTrashOutline } from "react-icons/io5";
import PrimaryText from "../../PrimaryText";
import { format12HourTime, padZero } from "../../../utils/dateFormat/dateTime";
import DeleteConfirmationModal from "../modal/deleteModal/DeleteConfirmationModal";
const SavedKundliList = ({
  title = "Saved Kundli",
  token,
  isLoading,
  kundlis,
  selectedKundliId,
  onSelect,
  onDelete,
  onLoginNavigate,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kundliToDelete, setKundliToDelete] = useState(null);

  const handleDeleteConfirm = () => {
    if (kundliToDelete) {
      onDelete(kundliToDelete);
    }
    setKundliToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setKundliToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <div className={styles.savedKundliContainer}>
      <h2 className={styles.sectionTitle}>{title}</h2>

      {/* CASE 1 — User is NOT logged in */}
      {!token ? (
        <div className={styles.notLoggedInBox}>
          <PrimaryText isCenter>You are not logged in.</PrimaryText>
          <button className={styles.loginButton} onClick={onLoginNavigate}>
            Login
          </button>
        </div>
      ) : isLoading ? (
        <PrimaryText isCenter>Loading...</PrimaryText>
      ) : kundlis?.length > 0 ? (
        <div className={styles.kundliList}>
          {kundlis.map((kundli) => (
            <div
              key={kundli._id}
              className={`${styles.kundliItem} ${
                selectedKundliId === kundli._id ? styles.active : ""
              }`}
            >
              <div className={styles.avatar}>{kundli.name.charAt(0)}</div>

              <div
                className={styles.kundliDetails}
                onClick={() => onSelect(kundli)}
              >
                <span className={styles.kundliName}>
                  {kundli.name}, {kundli.gender}
                </span>

                <span className={styles.kundliDob}>
                  {padZero(kundli.day)}-{padZero(kundli.month)}-{kundli.year} •{" "}
                  {format12HourTime(kundli.hour, kundli.min)}
                </span>

                <span className={styles.kundliPob}>{kundli.place}</span>
              </div>

              <button
                className={styles.deleteButton}
                onClick={() => {
                  setKundliToDelete(kundli._id);
                  setShowDeleteModal(true);
                }}
              >
                <IoTrashOutline />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <PrimaryText isCenter>No Data Found...</PrimaryText>
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default SavedKundliList;
