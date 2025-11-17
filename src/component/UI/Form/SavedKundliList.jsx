import React from "react";
import styles from "./SavedKundliList.module.scss";
import { IoTrashOutline } from "react-icons/io5";
import PrimaryText from "../../PrimaryText";

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
                  {kundli.day} {kundli.month}, {kundli.year} • {kundli.hour}:
                  {kundli.min}
                </span>

                <span className={styles.kundliPob}>{kundli.place}</span>
              </div>

              <button
                className={styles.deleteButton}
                onClick={() => onDelete(kundli._id)}
              >
                <IoTrashOutline />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <PrimaryText isCenter>No Data Found...</PrimaryText>
      )}
    </div>
  );
};

export default SavedKundliList;
