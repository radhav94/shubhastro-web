import React, { useState } from "react";
import styles from "./LifePath.module.scss";
import { PrimaryText, Toast } from "../../../../component";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setNumerologyPayload } from "../../../../redux/kundliform/formSlice";
import { PATH } from "../../../../utils/routes/Paths";
import { formatted, TODAY } from "../../../../utils/dateFormat/date";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";

const LifePathForm = () => {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!fullName.trim() || !dob.trim()) {
      // alert();
      Toast.error("Please enter name and date of birth");
      return;
    }

    // Convert yyyy-mm-dd → dd/mm/yyyy
    const [year, month, day] = dob.split("-");
    const formattedDate = `${day}/${month}/${year}`;
    const formatName = fullName.replaceAll(" ", "");

    dispatch(
      setNumerologyPayload({
        name: formatName,
        date: formattedDate,
      })
    );

    navigate(PATH.privateRoutes.LIFE_PATH_DETAIL.path);
  };

  return (
    <div className={styles.pageWrapper}>
      <PrimaryText
        as="h1"
        size_32
        isExtraBold
        isCenter
        className={styles.mainTitle}
      >
        Your Sacred Details
      </PrimaryText>

      <div className={styles.glow}></div>

      <div className={styles.card}>
        <div className={styles.topIcon}>✨</div>

        <PrimaryText
          size_24
          isBold
          isCenter
          color="#d49a2f"
          className={styles.cardTitle}
        >
          Tell Us About Yourself
        </PrimaryText>

        <PrimaryText
          size_16
          isCenter
          color="#6a6155"
          className={styles.cardSub}
        >
          Your cosmic journey begins with these sacred details
        </PrimaryText>

        {/* Full Name */}
        <div className={styles.fieldBox}>
          <PrimaryText size_16 isSemiBold className={styles.label}>
            Full Name
          </PrimaryText>

          <input
            type="text"
            placeholder="Enter your full name"
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {/* DOB */}
        <div className={styles.fieldBox}>
          <PrimaryText size_16 isSemiBold className={styles.label}>
            Date of Birth
          </PrimaryText>

          {/* <input type="date" placeholder="DD/MM/YYYY" className={styles.input} value={dob} max={TODAY} onClick={(e) => e.target.showPicker?.()} onChange={(e) => setDob(e.target.value)} /> */}
          <DateTimePicker
            mode="date"
            selected={dob ? new Date(dob) : null}
            onChange={(date) => {
              if (date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const dd = String(date.getDate()).padStart(2, "0");
                setDob(`${yyyy}-${mm}-${dd}`);
              } else {
                setDob("");
              }
            }}
            placeholder="DD/MM/YYYY"
          />
        </div>

        {/* CTA */}
        <button className={styles.primaryBtn} onClick={handleSubmit}>
          ✨ Reveal My Numbers
        </button>
      </div>

      <PrimaryText size_16 isCenter color="#444" className={styles.footerText}>
        Your information remains private and sacred
      </PrimaryText>
    </div>
  );
};

export default LifePathForm;
