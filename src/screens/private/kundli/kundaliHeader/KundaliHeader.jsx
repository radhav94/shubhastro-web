import React, { useState } from "react";
import styles from "./KundaliHeader.module.scss";
import { IoTrashOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import LocationSearch from "../../../../utils/location/locationSearch";
import { PrimaryText, Toast } from "../../../../component";
import { useDispatch } from "react-redux";
import { setForm } from "../../../../redux/kundliform/formSlice";
import { useNavigate } from "react-router-dom";
import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} from "../../../../services/appServices/kundliServicesNew";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

// Constants
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

// Month name → number
const monthMap = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

const initialFormData = {
  name: "",
  gender: "",
  day: "",
  month: "",
  year: "",
  hour: "",
  minute: "",
  second: "",
  birthPlace: "",
  latitude: null,
  longitude: null,
};

// Animations
const headerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

const KundaliHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // const token = localStorage.getItem("verifyOtpToken");
  const role = localStorage.getItem("shubhtalk_role");
const token =
  role === "ASTROLOGER"
    ? localStorage.getItem("shubhtalk_astro_token")
    : localStorage.getItem("shubhtalk_customer_token");


  const [formData, setFormData] = useState(initialFormData);
  const [selectedKundliId, setSelectedKundliId] = useState(null);

  // API Hooks
  const { data, isLoading } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const savedKundlis = data?.data || [];

  // Input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Place Selection
  const handlePlaceSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      birthPlace: place.address,
      latitude: place.lat,
      longitude: place.lng,
    }));
  };

  // Select Saved Kundli
  const handleSelectKundli = (kundli) => {
    setSelectedKundliId(kundli._id);

    // setFormData({
    //   name: kundli.name,
    //   gender: kundli.gender === "M" ? "Male" : "Female",
    //   day: kundli.day.toString(),
    //   month: kundli.month,
    //   year: kundli.year.toString(),
    //   hour: kundli.hour.toString(),
    //   minute: kundli.min.toString(),
    //   second: "0",
    //   birthPlace: kundli.place,
    //   latitude: kundli.lat,
    //   longitude: kundli.lon,
    // });

    dispatch(
      setForm({
        name: kundli.name,
        gender: kundli.gender === "M" ? "Male" : "Female",
        day: kundli.day.toString(),
        month: months[kundli.month - 1], // FIXED HERE
        year: kundli.year.toString(),
        hour: kundli.hour.toString(),
        minute: kundli.min.toString(),
        second: "0",
        birthPlace: kundli.place,
        latitude: kundli.lat,
        longitude: kundli.lon,
      })
    );
    setTimeout(() => {
      document.getElementById("kundli-tabs")?.scrollIntoView({
        behavior: "smooth",
        // block: "start",
      });
    }, 300);
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.birthPlace) {
      Toast.error("Please select your birth place");
      return;
    }
    const payload = {
      name: formData.name,
      gender: formData.gender.toLowerCase(),
      day: Number(formData.day),
      month: monthMap[formData.month],
      year: Number(formData.year),
      hour: Number(formData.hour),
      min: Number(formData.minute),
      second: Number(formData.second),
      place: formData.birthPlace,
      lat: Number(formData.latitude),
      lon: Number(formData.longitude),
      tzone: 5.5,
    };

    try {
      await createKundli(payload).unwrap();
      setFormData(initialFormData);
    } catch (err) {
      console.log(err);
    }
    dispatch(setForm(formData));
  };

  // Delete Kundli
  const onDelete = async (id) => {
    try {
      await deleteKundli(id).unwrap();

      if (selectedKundliId === id) {
        setFormData(initialFormData);
        setSelectedKundliId(null);
      }
    } catch (err) {
      console.log("Delete failed", err);
    }
  };

  return (
    <>
      {/* Header */}
      <motion.div
        className={styles.headerSection}
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants}>Free Kundli Online</motion.h1>
        <motion.p variants={itemVariants}>
          A Kundli, or birth chart, is an astrological map of your life's
          journey.
        </motion.p>
      </motion.div>

      <div className={styles.kundliPageContainer}>
        {/* FORM SECTION */}
        <div className={styles.formContainer}>
          <h2 className={styles.sectionTitle}>Create New Kundli</h2>

          <form onSubmit={handleSubmit} className={styles.kundliForm}>
            {/* Name */}
            <div className={styles.formGroup}>
              <label className={styles.required}>Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
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
                <option value="">Select your gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Date of Birth */}
            <h3 className={styles.formSectionHeader}>Date of Birth</h3>
            <div className={styles.gridContainer}>
              <div className={styles.formGroup}>
                <label className={styles.required}>Day</label>
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Day</option>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>Month</label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time of Birth */}
            <h3 className={styles.formSectionHeader}>Time of Birth</h3>
            <div className={styles.gridContainer}>
              <div className={styles.formGroup}>
                <label className={styles.required}>Hour</label>
                <select
                  name="hour"
                  value={formData.hour}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Hour</option>
                  {hours.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>Minute</label>
                <select
                  name="minute"
                  value={formData.minute}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Minute</option>
                  {minutes.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>Second</label>

                <select
                  name="second"
                  value={formData.second}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Second</option>

                  {minutes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Birth Place */}
            <div className={styles.formGroup}>
              <label className={styles.required}>Birth Place</label>
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

            {token ? (
              <button type="submit" className={styles.ctaButton}>
                Generate Horoscope
              </button>
            ) : (
              <div className={styles.loginPrompt}>
                <p>Please login to continue</p>
                <button
                  className={styles.loginButton}
                  onClick={() =>
                    navigate("/login", { state: { from: location.pathname } })
                  }
                >
                  Login
                </button>
              </div>
            )}
          </form>
        </div>

        {/* SAVED KUNDLI SECTION */}
        <div className={styles.savedKundliContainer}>
          <h2 className={styles.sectionTitle}>Saved Kundli</h2>

          {/* CASE 1 — User is NOT logged in */}
          {!token ? (
            <div className={styles.notLoggedInBox}>
              <PrimaryText isCenter>You are not logged in.</PrimaryText>
              <button
                className={styles.loginButton}
                onClick={() =>
                  navigate("/login", { state: { from: location.pathname } })
                }
              >
                Login
              </button>
            </div>
          ) : isLoading ? (
            <PrimaryLoader/>
          ) : savedKundlis.length > 0 ? (
            <div className={styles.kundliList}>
              {savedKundlis.map((kundli) => (
                <div
                  key={kundli._id}
                  className={`${styles.kundliItem} ${
                    selectedKundliId === kundli._id ? styles.active : ""
                  }`}
                >
                  <div className={styles.avatar}>{kundli.name.charAt(0)}</div>

                  <div
                    className={styles.kundliDetails}
                    onClick={() => handleSelectKundli(kundli)}
                  >
                    <span className={styles.kundliName}>
                      {kundli.name}, {kundli.gender}
                    </span>

                    <span className={styles.kundliDob}>
                      {kundli.day} {kundli.month}, {kundli.year} • {kundli.hour}
                      :{kundli.min}
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
      </div>
    </>
  );
};

export default KundaliHeader;
