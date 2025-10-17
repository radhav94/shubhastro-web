import React, { useState } from "react";
import styles from "./KundaliHeader.module.scss";
import { IoTrashOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import LocationSearch from "../../../../utils/location/locationSearch";
import { PrimaryText } from "../../../../component";

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

// --- Sample Data ---
const savedKundliData = [
  {
    id: 1,
    name: "Rohan Kamble",
    gender: "M",
    dob: "16 Aug, 1997",
    tob: "02:00 AM",
    pob: "Mumbai, Maharashtra, India",
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    id: 2,
    name: "Sanket Patil",
    gender: "M",
    dob: "16 Jun, 1999",
    tob: "06:15 AM",
    pob: "Mumbai, Maharashtra, India",
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    id: 3,
    name: "Shamal",
    gender: "F",
    dob: "31 Oct, 1999",
    tob: "06:00 AM",
    pob: "Kolhapur, Maharashtra, India",
    latitude: 16.705,
    longitude: 74.2433,
  },
  {
    id: 4,
    name: "Priya Sharma",
    gender: "F",
    dob: "22 May, 2001",
    tob: "08:30 PM",
    pob: "Pune, Maharashtra, India",
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    id: 5,
    name: "Vikram Singh",
    gender: "M",
    dob: "10 Jan, 1995",
    tob: "12:45 PM",
    pob: "Nagpur, Maharashtra, India",
    latitude: 21.1458,
    longitude: 79.0882,
  },
];

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

const KundaliHeader = ({ onGenerateClick }) => {
  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    day: "1",
    month: "Jan",
    year: currentYear.toString(),
    hour: "0",
    minute: "0",
    second: "0",
    birthPlace: "",
    latitude: null,
    longitude: null,
  });
  const [selectedKundliId, setSelectedKundliId] = useState(null);
  const [savedKundlis, setSavedKundlis] = useState(savedKundliData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      birthPlace: place.address,
      latitude: place.lat,
      longitude: place.lng,
    }));
  };

  const handleSelectKundli = (kundli) => {
    setSelectedKundliId(kundli.id);
    const [day, monthStr, year] = kundli.dob.replace(",", "").split(" ");
    const [time, period] = kundli.tob.split(" ");
    let [hour, minute] = time.split(":").map(Number);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    setFormData({
      name: kundli.name,
      gender: kundli.gender === "M" ? "Male" : "Female",
      day,
      month: monthStr,
      year,
      hour: hour.toString(),
      minute: minute.toString(),
      second: "0",
      birthPlace: kundli.pob,
      latitude: kundli.latitude,
      longitude: kundli.longitude,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Generating Horoscope with data:", formData);
    if (onGenerateClick) {
      onGenerateClick(formData);
    }
  };

  const onDelete = (id) => {
    setSavedKundlis((prevKundlis) =>
      prevKundlis.filter((kundli) => kundli.id !== id)
    );

    if (selectedKundliId === id) {
      setFormData(initialFormData);
      setSelectedKundliId(null);
    }

    console.log("Deleted Kundli with ID:", id);
  };

  return (
    <>
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
        <div className={styles.formContainer}>
          <h2 className={styles.sectionTitle}>Create New Kundli</h2>
          <form onSubmit={handleSubmit} className={styles.kundliForm}>
            {/* --- Name and Gender --- */}
            <div className={styles.formGroup}>
              <label htmlFor="name">Name</label>
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
              </select>
            </div>

            {/* --- Date of Birth --- */}
            <h3 className={styles.formSectionHeader}>Date of Birth</h3>
            <div className={styles.gridContainer}>
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

            {/* --- Time of Birth --- */}
            <h3 className={styles.formSectionHeader}>Time of Birth</h3>
            <div className={styles.gridContainer}>
              <div className={styles.formGroup}>
                <label>Hour</label>
                <select
                  name="hour"
                  value={formData.hour}
                  onChange={handleInputChange}
                >
                  {hours.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Minute</label>
                <select
                  name="minute"
                  value={formData.minute}
                  onChange={handleInputChange}
                >
                  {minutes.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Second</label>
                <select
                  name="second"
                  value={formData.second}
                  onChange={handleInputChange}
                >
                  {minutes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* --- Birth Place --- */}
            <div className={styles.formGroup}>
              <label htmlFor="birthPlace">Birth Place</label>
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
          </form>
        </div>

        <div className={styles.savedKundliContainer}>
          <h2 className={styles.sectionTitle}>Saved Kundli</h2>
          {savedKundlis.length > 0 ? (
            <div className={styles.kundliList}>
              {savedKundlis.map((kundli) => (
                <div
                  key={kundli.id}
                  className={`${styles.kundliItem} ${
                    selectedKundliId === kundli.id ? styles.active : ""
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
                      {kundli.dob} &nbsp; {kundli.tob}
                    </span>
                    <span className={styles.kundliPob}>{kundli.pob}</span>
                  </div>
                  <button
                    className={styles.deleteButton}
                    onClick={() => onDelete(kundli.id)}
                  >
                    <IoTrashOutline />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <PrimaryText isCenter> No Data Found...</PrimaryText>
          )}
        </div>
      </div>
    </>
  );
};

export default KundaliHeader;
