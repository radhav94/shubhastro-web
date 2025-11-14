import React, { useState, useEffect, useRef } from "react";
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import styles from "./Register.module.scss";
import { PrimaryButton, PrimaryText, Toast } from "../../component";
import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "../../utils/routes/Paths";
import { registerUser } from "../../services/appServices/authService";
import LocationSearch from "../../utils/location/locationSearch";
// import LocationSearch from "../../components/locationSearch/LocationSearch";

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
  const placeRef = useRef(null);

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

    const {
      firstName, lastName, email, password, confirmPassword,
      gender, day, month, year, address, latitude, longitude, birthPlace
    } = formData;

    // Required Field Validation
    if (!firstName || !lastName || !gender || !day || !month || !year) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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
      password,
      place: birthPlace || "",
      email,
      languagePreferences: ["English", "Hindi"],
      dateOfBirth,
      address,
      lat: latitude?.toString() || "",
      lon: longitude?.toString() || "",
      role: "CUSTOMER",
    };

    let response;

    try {
      response = await registerUser(payload);
    } catch (apiErr) {
      // API Crashed => Handle here, do NOT break page
      setToast({
        show: true,
        type: "error",
        message: apiErr?.response?.data?.message || "Something went wrong!",
      });
      setLoading(false);
      return;
    }

    if (response?.data?.statusCode === 201) {
      setToast({
        show: true,
        type: "success",
        message: "Registration successful!",
      });

      setTimeout(() => {
        navigate(PATH.privateRoutes.HOME.path, { replace: true });
      }, 1000);
    } else {
      setToast({
        show: true,
        type: "error",
        message: response?.data?.message || "Something went wrong!",
      });
    }

  } catch (err) {
    // Last layer protection
    console.error("Unexpected error:", err);
    setToast({
      show: true,
      type: "error",
      message: "Unexpected error occurred.",
    });
  } finally {
    setLoading(false);
  }
};


console.log(LocationSearch);


  return (
    <LoginLayout register={true}>
      <div className={styles.container}>
        {toast.show && <Toast type={toast.type} message={toast.message} />}

        <PrimaryText paddingBottom={20}>
          Join us to get personalized insights and services.
        </PrimaryText>

        <form onSubmit={handleRegister} className={styles.form}>

          {/* First + Last Name */}
          <div className={styles.row}>
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
          </div>
          <div className={styles.formGroup}>
            <label className={styles.required}>Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Email */}
          <div className={styles.formGroup}>
            <label className={styles.required}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Password + Confirm */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.required}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.required}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.required} htmlFor="birthPlace">Birth Place</label>
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


          <h3 className={styles.sectionHeader}>Date of Birth</h3>

          {/* DOB Grid */}
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label>Day</label>
              <select name="day" value={formData.day} onChange={handleInputChange}>
                <option>Day</option>
                {days.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Month</label>
              <select name="month" value={formData.month} onChange={handleInputChange}>
                <option>Month</option>
                {months.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Year</label>
              <select name="year" value={formData.year} onChange={handleInputChange}>
                <option>Year</option>
                {years.map((y) => <option key={y}>{y}</option>)}
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
