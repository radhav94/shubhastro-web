import React, { useState } from "react";
import styles from "./KundaliHeader.module.scss";
import { IoSearchOutline, IoTrashOutline } from "react-icons/io5";
import { motion } from "framer-motion";

// --- Helper data for dropdowns (no changes here) ---
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

// Sample Data
const savedKundliData = [
  {
    id: 1,
    name: "Rohan Kamble",
    gender: "M",
    dob: "16 Aug, 1997",
    tob: "02:00 AM",
    pob: "Mumbai, Maharashtra, India",
  },
  {
    id: 2,
    name: "Sanket Patil",
    gender: "M",
    dob: "16 Jun, 1999",
    tob: "06:15 AM",
    pob: "Mumbai, Maharashtra, India",
  },
  {
    id: 3,
    name: "Shamal",
    gender: "F",
    dob: "31 Oct, 1999",
    tob: "06:00 AM",
    pob: "Kolhapur, Maharashtra, India",
  },
  {
    id: 4,
    name: "Priya Sharma",
    gender: "F",
    dob: "22 May, 2001",
    tob: "08:30 PM",
    pob: "Pune, Maharashtra, India",
  },
  {
    id: 5,
    name: "Vikram Singh",
    gender: "M",
    dob: "10 Jan, 1995",
    tob: "12:45 PM",
    pob: "Nagpur, Maharashtra, India",
  },
];

// Animation variants for the header
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
  });
  const [selectedKundliId, setSelectedKundliId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectKundli = (kundli) => {
    setSelectedKundliId(kundli.id);

    // --- LOGIC TO POPULATE FORM ---
    const [day, monthStr, year] = kundli.dob.replace(",", "").split(" ");
    const [time, period] = kundli.tob.split(" ");
    let [hour, minute] = time.split(":").map(Number);

    // Convert 12-hour to 24-hour format
    if (period === "PM" && hour !== 12) {
      hour += 12;
    }
    if (period === "AM" && hour === 12) {
      hour = 0;
    }

    setFormData({
      name: kundli.name,
      gender: kundli.gender === "M" ? "Male" : "Female",
      day: day,
      month: monthStr,
      year: year,
      hour: hour.toString(),
      minute: minute.toString(),
      second: "0", // Assuming seconds are not in the saved data
      birthPlace: kundli.pob,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerateClick(e);
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
          journey. It uses your birth date, time, and place to reveal insights
          into your past, present, and future.
        </motion.p>
      </motion.div>

      <div className={styles.kundliPageContainer}>
        <div className={styles.formContainer}>
          <h2 className={styles.sectionTitle}>Create New Kundli</h2>
          <form onSubmit={handleSubmit} className={styles.kundliForm}>
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
            <h3 className={styles.formSectionHeader}>Birth Details</h3>
            <div className={styles.gridContainer}>
              <div className={styles.formGroup}>
                <label htmlFor="day">Day</label>
                <select
                  id="day"
                  name="day"
                  value={formData.day}
                  onChange={handleInputChange}
                  required
                >
                  {days.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="month">Month</label>
                <select
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  required
                >
                  {months.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="year">Year</label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                >
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="hour">Hour</label>
                <select
                  id="hour"
                  name="hour"
                  value={formData.hour}
                  onChange={handleInputChange}
                  required
                >
                  {hours.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="minute">Minute</label>
                <select
                  id="minute"
                  name="minute"
                  value={formData.minute}
                  onChange={handleInputChange}
                  required
                >
                  {minutes.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="second">Second</label>
                <select
                  id="second"
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
            <div className={styles.formGroup}>
              <label htmlFor="birthPlace">Birth Place</label>
              <input
                type="text"
                id="birthPlace"
                name="birthPlace"
                value={formData.birthPlace}
                onChange={handleInputChange}
                placeholder="E.g., Mumbai, Maharashtra"
                required
              />
            </div>
            <button type="submit" className={styles.ctaButton}>
              Generate Horoscope
            </button>
          </form>
        </div>

        <div className={styles.savedKundliContainer}>
          <h2 className={styles.sectionTitle}>Saved Kundli</h2>

          <div className={styles.kundliList}>
            {savedKundliData.map((kundli) => (
              <div
                key={kundli.id}
                className={`${styles.kundliItem} ${
                  selectedKundliId === kundli.id ? styles.active : ""
                }`}
                onClick={() => handleSelectKundli(kundli)}
              >
                <div className={styles.avatar}>{kundli.name.charAt(0)}</div>
                <div className={styles.kundliDetails}>
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <IoTrashOutline />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default KundaliHeader;
