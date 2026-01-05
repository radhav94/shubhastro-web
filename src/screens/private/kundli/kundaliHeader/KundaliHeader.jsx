import React, { useEffect, useState, useRef } from "react";
import styles from "./KundaliHeader.module.scss";
import { IoTrashOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import { PrimaryText, Toast } from "../../../../component";
import { useDispatch } from "react-redux";
import { setForm } from "../../../../redux/kundliform/formSlice";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} from "../../../../services/appServices/kundliServicesNew";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { buildKundliPayload } from "./utils";
import {
  format12HourTime,
  padZero,
} from "../../../../utils/dateFormat/dateTime";

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
const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = Array.from({ length: 60 }, (_, i) => i);
const meridiem = ["AM", "PM"];

const initialFormData = {
  name: "",
  gender: "",
  day: "",
  month: "",
  year: "",
  hour: "",
  minute: "",
  meridiem: null,
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
  const location = useLocation();
  const { kundliId } = useParams();

  // const token = localStorage.getItem("verifyOtpToken");
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  const prevTokenRef = useRef(null);

  /* ----------------------------- State ----------------------------- */
  const [formData, setFormData] = useState(initialFormData);
  const [selectedKundliId, setSelectedKundliId] = useState(null);

  /* ----------------------------- API ----------------------------- */
  const { data, isLoading, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const savedKundlis = data?.data || [];

  /* --------------------- TOKEN CHANGE ---------------------- */
  useEffect(() => {
    const prevToken = prevTokenRef.current;

    if (!prevToken && token) {
      refetch();
    }

    if (prevToken && token && prevToken !== token) {
      setFormData(initialFormData);
      setSelectedKundliId(null);
      dispatch(setForm(initialFormData));
      refetch();
    }

    if (prevToken && !token) {
      setFormData(initialFormData);
      setSelectedKundliId(null);
      dispatch(setForm(initialFormData));
    }

    prevTokenRef.current = token;
  }, [token, refetch, dispatch]);

  /* ----------------- Auto select from URL ----------------- */
  useEffect(() => {
    if (!kundliId || !savedKundlis?.length) return;

    const selected = savedKundlis.find(
      (k) => String(k._id) === String(kundliId)
    );

    if (selected) handleSelectKundli(selected);
  }, [kundliId, savedKundlis]);

  // Input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Place Selection
  const handlePlaceSelect = (place) => {
    setFormData((p) => ({
      ...p,
      birthPlace: place.address,
      latitude: place.lat,
      longitude: place.lng,
    }));
  };

  // Select Saved Kundli
  const handleSelectKundli = (kundli) => {
    setSelectedKundliId(kundli._id);

    const gender =
      kundli.gender === "M" || kundli.gender === "Male" ? "Male" : "Female";

    const payload = {
      name: kundli.name,
      gender,
      day: String(kundli.day),
      month: months[kundli.month - 1],
      year: String(kundli.year),
      hour: String(kundli.hour),
      minute: String(kundli.min),
      meridiem: kundli.meridiem || "",
      birthPlace: kundli.place,
      latitude: kundli.lat,
      longitude: kundli.lon,
    };

    setFormData(payload);
    dispatch(setForm(payload));

    setTimeout(() => {
      document.getElementById("kundli-tabs")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.birthPlace) {
      Toast.error("Please select your birth place");
      return;
    }

    try {
      if (token) {
        const payload = buildKundliPayload(formData);
        await createKundli(payload).unwrap();
        refetch();
      }

      dispatch(setForm(formData));
      setFormData(initialFormData);
      setSelectedKundliId(null);
    } catch (err) {
      console.log(err);
    }
  };

  // Delete Kundli
  const onDelete = async (id) => {
    await deleteKundli(id).unwrap();

    if (selectedKundliId === id) {
      setSelectedKundliId(null);
      setFormData(initialFormData);
      dispatch(setForm(initialFormData));
    }
    refetch();
  };

  const activeStyle = {
    display: "none",
    background: "black",
  };
  return (
    <div style={kundliId ? activeStyle : null}>
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
                <label className={styles.required}>Meridiem (AM/ PM) </label>

                <select
                  name="meridiem"
                  required
                  value={formData.meridiem}
                  onChange={handleInputChange}
                >
                  <option value="">Select Meridiem</option>

                  {meridiem.map((s) => (
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

            <button type="submit" className={styles.ctaButton}>
              Generate Horoscope
            </button>

            {/* {token ? (
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
            )} */}
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
            <PrimaryLoader />
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
                      {padZero(kundli.day)}-{padZero(kundli.month)}-
                      {kundli.year} •{" "}
                      {format12HourTime(kundli.hour, kundli.min)}
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
    </div>
  );
};

export default KundaliHeader;
