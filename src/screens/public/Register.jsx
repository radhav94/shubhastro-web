import React, { useState } from "react";
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import styles from "./Register.module.scss"; // CSS Module import
import { PrimaryButton, PrimaryText } from "../../component";
import { appColors } from "../../utils/theme";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../utils/routes/Paths";

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 88 }, (_, i) => currentYear - 13 - i);

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    day: "",
    month: "",
    year: "",
  });

  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.gender ||
      !formData.day ||
      !formData.month ||
      !formData.year
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    console.log("Registration Data Submitted:", formData);
    alert(`Welcome, ${formData.name}! Your account has been created.`);
  };

  const onSaveDetails = () => {
    console.log("asdkhjf");
    navigate(PATH.privateRoutes.HOME.path, { replace: true });
  };

  return (
    <LoginLayout>
      <div className={styles.container}>
        <PrimaryText paddingBottom={20}>
          Join us to get personalized insights and services.
        </PrimaryText>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <h3 className={styles.sectionHeader}>Date of Birth</h3>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label>Day</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleInputChange}
              >
                {days.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Month</label>
              <select
                name="month"
                value={formData.month}
                onChange={handleInputChange}
              >
                {months.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
              >
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <PrimaryButton title="Save Details" onClick={onSaveDetails} />
        </form>
      </div>
    </LoginLayout>
  );
};

export default Register;
