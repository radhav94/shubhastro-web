import React, { useState } from "react";
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import styles from "./Register.module.scss";
import { PrimaryButton, PrimaryText, Toast } from "../../component";
import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "../../utils/routes/Paths";
import { registerUser } from "../../services/appServices/authService";

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 88 }, (_, i) => currentYear - 13 - i);

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    day: "",
    month: "",
    year: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getMonthNumber = (monthName) => {
    const index = months.indexOf(monthName);
    return index !== -1 ? index + 1 : "";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword, gender, day, month, year } = formData;

    if (!firstName || !lastName || !gender || !day || !month || !year) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const dateOfBirth = `${year}-${getMonthNumber(month)
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    const payload = {
      phoneNumber: location?.state?.from?.state?.phoneNumber,
      firstName,
      lastName,
      password,
      email,
      languagePreferences: ["English", "Hindi"],
      dateOfBirth,
      time: new Date().toISOString(),
      place: "Mumbai",
      role: "CUSTOMER",
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("verifyOtpToken");
      const response = await registerUser(payload, token);

      console.log("stattssssss",response);
      setTimeout(() => {
          navigate(PATH.privateRoutes.HOME.path, { replace: true });
        }, 1500);

      if (response?.data?.statusCode === 201) {
        setToast({
          show: true,
          type: "success",
          message: "Registration successful!",
        });
          navigate(PATH.privateRoutes.HOME.path, { replace: true });

        // setTimeout(() => {
        // }, 1500);
      } else {
        setToast({
          show: true,
          type: "error",
          message: response?.data?.message || "Something went wrong!",
        });
      }
    } catch (err) {
      console.error(err);
      setToast({
        show: true,
        type: "error",
        message: err?.response?.data?.message || "Registration failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginLayout>
      <div className={styles.container}>
        {toast.show && <Toast type={toast.type} message={toast.message} />}

        <PrimaryText paddingBottom={20}>
          Join us to get personalized insights and services.
        </PrimaryText>

        <form onSubmit={handleRegister} className={styles.form}>
          {/* FIRST NAME */}
          <div className={styles.formGroup}>
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              required
            />
          </div>

          {/* LAST NAME */}
          <div className={styles.formGroup}>
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm password"
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
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <h3 className={styles.sectionHeader}>Date of Birth</h3>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label>Day</label>
              <select name="day" value={formData.day} onChange={handleInputChange}>
                <option value="">Day</option>
                {days.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Month</label>
              <select name="month" value={formData.month} onChange={handleInputChange}>
                <option value="">Month</option>
                {months.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Year</label>
              <select name="year" value={formData.year} onChange={handleInputChange}>
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <PrimaryButton
            title={loading ? "Registering..." : "Save Details"}
            type="submit"
            disabled={loading}
          />
        </form>
      </div>
    </LoginLayout>
  );
};

export default Register;
