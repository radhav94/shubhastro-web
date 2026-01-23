import React, { useState, useEffect, useRef } from "react";
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import styles from "./Register.module.scss";
import { PrimaryButton, PrimaryText, Toast } from "../../component";
import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "../../utils/routes/Paths";
import { registerUser } from "../../services/appServices/authService";
import LocationSearch from "../../utils/location/locationSearchVedic";

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
const years = Array.from({ length: 88 }, (_, i) => currentYear - 1 - i);

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: "",
    address: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    day: "",
    month: "",
    year: "",
    birthPlace: "",
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // const [toast, setToast] = useState({ show: false, type: "", message: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getMonthNumber = (monthName) => {
    const index = months.indexOf(monthName);
    return index !== -1 ? index + 1 : "";
  };

  const handlePlaceSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      birthPlace: place.address,
      latitude: place.lat,
      longitude: place.lng,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      const { firstName, lastName, gender, day, month, year, birthPlace } =
        formData;

      // Required Field Validation
      if (
        !firstName ||
        !lastName ||
        !gender ||
        !day ||
        !month ||
        !year ||
        !birthPlace
      ) {
        setError("Please fill in all required fields.");
        setLoading(false);
        return;
      }

      const dateOfBirth = `${year}-${getMonthNumber(month)
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

      const phoneNumber = location?.state?.from?.state?.phoneNumber || "";
      const payload = {
        phoneNumber,
        firstName,
        lastName,
        place: birthPlace || "",
        languagePreferences: ["English", "Hindi"],
        dateOfBirth,
        role: "CUSTOMER",
      };

      let response;

      try {
        response = await registerUser(payload);
      } catch (apiErr) {
        console.error("apiErrror", apiErr);

        const backendMessage =
          apiErr?.response?.data?.message ||
          apiErr?.response?.data?.error ||
          "Invalid input";

        setError(backendMessage); // 🔥 EXACT backend message
        setLoading(false);

        Toast.error(apiErr?.response?.data?.message || "Something went wrong!");

        setLoading(false);
        return;
      }

      if (response?.data?.statusCode === 201) {
        Toast.success("Registration successful!");

        navigate(PATH.privateRoutes.HOME.path, { replace: true });
      } else {
        Toast.error(response?.data?.message || "Something went wrong!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);

      Toast.error("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginLayout register={true}>
      <div className={styles.container}>
        {/* {toast.show && <Toast type={toast.type} message={toast.message} />} */}

        <PrimaryText paddingBottom={20}>
          Join us to get personalized insights and services.
        </PrimaryText>

        <form onSubmit={handleRegister} className={styles.form}>
          {/* First + Last Name */}
          {/* <div className={styles.row}> */}
          <div className={styles.formGroup}>
            <label className={styles.required}>First Name</label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.required}>Last Name</label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
          <h3 className={styles.sectionHeader}>Date of Birth</h3>

          {/* DOB Grid */}
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.required}>Day</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleInputChange}
              >
                <option value="">Select Day</option>
                {days.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.required}>Month</label>
              <select
                name="month"
                value={formData.month}
                onChange={handleInputChange}
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.required}>Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
              >
                <option value="">Select Year</option>

                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="birthPlace" className={styles.required}>
              Birth Place
            </label>
            <LocationSearch
              value={formData.birthPlace}
              onChange={(e) =>
                handleInputChange({
                  target: { name: "birthPlace", value: e.target.value },
                })
              }
              onPlaceSelect={handlePlaceSelect}
            />
          </div>

          {/* Gender */}
          <div className={styles.formGroup}>
            <label className={styles.required}>Gender</label>
            <select
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
