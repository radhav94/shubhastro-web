import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "axios";
import {
  IoCalendar,
  IoCheckmarkCircle,
  IoChevronBack,
  IoChevronDown,
  IoChevronForward,
  IoLocation,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoLinkedin,
  IoLogoWhatsapp,
  IoLogoYoutube,
  IoMail,
  IoNotifications,
  IoScan,
  IoShieldCheckmark,
} from "react-icons/io5";
import ShubhAstroLogo from "../../../assets/images/ShubhAstrologo.svg";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import styles from "./ComingSoon.module.scss";

const API_URL = "https://devapi-shubhtalk.epicon.in/api/landing-leads/submit";

const initialValues = {
  fullName: "",
  mobile: "",
  email: "",
  interest: "",
  dob: "",
  placeOfBirth: "",
};

const validationSchema = Yup.object({
  fullName: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .required("Name is required"),
  mobile: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .required("Mobile number is required"),
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
  interest: Yup.string().required("Please select a role"),
  dob: Yup.string().required("Date of birth is required"),
  placeOfBirth: Yup.string(),
});

const interestOptions = ["User", "Expert/Astrologer"];

const WHATSAPP_INVITE_URL = "https://chat.whatsapp.com/YOUR_INVITE_CODE";

const whatsappBenefits = [
  "Get instant updates",
  "Early access to new features",
  "Personalized offers & more!",
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: IoLogoFacebook },
  { label: "YouTube", href: "#", icon: IoLogoYoutube },
  { label: "Instagram", href: "#", icon: IoLogoInstagram },
  { label: "LinkedIn", href: "#", icon: IoLogoLinkedin },
];

const countryCodes = [
  { code: "+91", label: "India" },
  { code: "+1", label: "USA" },
  { code: "+44", label: "UK" },
  { code: "+61", label: "Australia" },
  { code: "+971", label: "UAE" },
  { code: "+65", label: "Singapore" },
  { code: "+60", label: "Malaysia" },
  { code: "+977", label: "Nepal" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const ComingSoon = () => {
  const [selectedCode, setSelectedCode] = useState("+91");
  const [codeOpen, setCodeOpen] = useState(false);
  const codeRef = useRef(null);
  const [interestOpen, setInterestOpen] = useState(false);
  const interestRef = useRef(null);
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const calRef = useRef(null);
  const yearListRef = useRef(null);
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });
  const [submittedData, setSubmittedData] = useState(null);

  const utmParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    if (params.get("utm_source")) utm.utmSource = params.get("utm_source");
    if (params.get("utm_medium")) utm.utmMedium = params.get("utm_medium");
    if (params.get("utm_campaign")) utm.utmCampaign = params.get("utm_campaign");
    return utm;
  }, []);

  const handleSubmit = async (values, { resetForm }) => {
    setSubmitState({ status: "loading", message: "" });
    try {
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        mobileNumber: values.mobile.trim(),
        dateOfBirth: values.dob.split("-").reverse().join("/"),
        iAmHereAs: values.interest.toLowerCase(),
        placeOfBirth: values.placeOfBirth.trim(),
        source: "landing_page",
        ...utmParams,
      };
      const { data } = await axios.post(API_URL, payload);
      if (data?.success) {
        setSubmittedData({ role: values.interest.toLowerCase(), name: values.fullName.trim() });
        setSubmitState({ status: "success", message: "" });
        resetForm();
      } else {
        setSubmitState({ status: "error", message: data?.message || "Something went wrong. Please try again." });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      setSubmitState({ status: "error", message: msg });
    }
  };

  const handleCodeSelect = useCallback((code) => {
    setSelectedCode(code);
    setCodeOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (codeRef.current && !codeRef.current.contains(e.target)) {
        setCodeOpen(false);
      }
      if (interestRef.current && !interestRef.current.contains(e.target)) {
        setInterestOpen(false);
      }
      if (calRef.current && !calRef.current.contains(e.target)) {
        setCalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCalendarDays = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const currentYear = new Date().getFullYear();
  const yearRange = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= 1920; y--) years.push(y);
    return years;
  }, [currentYear]);

  useEffect(() => {
    if (yearPickerOpen && yearListRef.current) {
      const activeEl = yearListRef.current.querySelector('[data-active="true"]');
      if (activeEl) activeEl.scrollIntoView({ block: "center" });
    }
  }, [yearPickerOpen]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const formatDobDisplay = (value) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img src={ShubhAstroLogo} alt="ShubhAstro" className={styles.logo} />
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.badge}>SOMETHING EXTRAORDINARY IS ON THE WAY</span>
              <h1 className={styles.heading}>
                We Are
                <span className={styles.headingAccent}>Coming Soon!</span>
              </h1>
              <p className={styles.subtitle}>
                A smarter, more personalized astrology experience is on its way.
                Stay tuned for something extraordinary.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.contentCard}>
            {submitState.status === "success" && submittedData ? (
              <div className={styles.thankYouWrap}>
                <span className={styles.mailBadge}>
                  <IoCheckmarkCircle />
                </span>
                <div className={styles.formHeader}>
                  <h2>
                    Thank <span className={styles.orange}>You!</span>
                  </h2>
                </div>
                {submittedData.role === "expert/astrologer" ? (
                  <div className={styles.thankYouBody}>
                    <p>
                      Thanks, {submittedData.name}. We're building something special and would love to have you onboard.
                    </p>
                    <p>
                      Our team will reach out within 3–5 days to discuss your application and walk you through the onboarding process once we go live.
                    </p>
                    <p>
                      Have questions? Write to{" "}
                      <a href="mailto:onboarding@shubhastro.in" className={styles.thankYouLink}>
                        onboarding@shubhastro.in
                      </a>{" "}
                      or WhatsApp{" "}
                      <a href="https://wa.me/91XXXXXXXXXX" className={styles.thankYouLink}>
                        +91-XXXXXXXXXX
                      </a>
                    </p>
                  </div>
                ) : (
                  <div className={styles.thankYouBody}>
                    <p>
                      You're on the list! We'll notify you when ShubhAstro launches.
                    </p>
                    <p>
                      Join WhatsApp for early access updates.
                    </p>
                    <a
                      href={WHATSAPP_INVITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.whatsappBtn}
                    >
                      <IoLogoWhatsapp />
                      Join WhatsApp Community
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => {
                    setSubmitState({ status: "idle", message: "" });
                    setSubmittedData(null);
                  }}
                  style={{ marginTop: 24 }}
                >
                  Submit Another Response
                </button>
              </div>
            ) : (
              <>
            <span className={styles.mailBadge}>
              <IoMail />
            </span>

            <div className={styles.formHeader}>
              <h2>
                Be the <span className={styles.orange}>First</span> to Know!
              </h2>
              <p>
                Join our community and get exclusive updates, early access & special
                launch offers.
              </p>
            </div>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue, errors, touched, isSubmitting }) => (
                <Form className={styles.form}>
                  <div className={styles.fieldGrid}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="fullName">Name</label>
                      <div className={styles.inputWrap}>
                        <Field
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder="Enter here"
                          className={styles.input}
                        />
                      </div>
                      {touched.fullName && errors.fullName && (
                        <p className={styles.error}>{errors.fullName}</p>
                      )}
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="mobile">Mobile Number</label>
                      <div className={styles.phoneInput}>
                        <div className={styles.countrySelect} ref={codeRef}>
                          <button
                            type="button"
                            className={styles.countryToggle}
                            disabled
                            aria-label="Country code"
                          >
                            <span className={styles.flagBadge} aria-hidden="true">
                              <span />
                              <span />
                              <span />
                            </span>
                            <span className={styles.codeText}>{selectedCode}</span>
                            <IoChevronDown className={styles.codeChevron} />
                          </button>
                          {codeOpen && (
                            <ul className={styles.codeDropdown} role="listbox">
                              {countryCodes.map(({ code, label }) => (
                                <li
                                  key={code}
                                  role="option"
                                  aria-selected={code === selectedCode}
                                  className={`${styles.codeOption} ${code === selectedCode ? styles.codeOptionActive : ""}`}
                                  onClick={() => handleCodeSelect(code)}
                                >
                                  <span>{code}</span>
                                  <span className={styles.codeLabel}>{label}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <Field
                          id="mobile"
                          name="mobile"
                          type="tel"
                          placeholder="98989 98989"
                          maxLength={10}
                          className={`${styles.input} ${styles.mobileInput}`}
                        />
                      </div>
                      {touched.mobile && errors.mobile && (
                        <p className={styles.error}>{errors.mobile}</p>
                      )}
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="email">Email ID</label>
                      <div className={styles.inputWrap}>
                        <Field
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter here"
                          className={styles.input}
                        />
                      </div>
                      {touched.email && errors.email && (
                        <p className={styles.error}>{errors.email}</p>
                      )}
                    </div>

                    <div className={styles.fieldGroup}>
                      <label>I am here as</label>
                      <div className={styles.customSelect} ref={interestRef}>
                        <button
                          type="button"
                          className={styles.selectToggle}
                          onClick={() => setInterestOpen((prev) => !prev)}
                          aria-expanded={interestOpen}
                        >
                          <span className={values.interest ? styles.selectValue : styles.selectPlaceholder}>
                            {values.interest || "--Select--"}
                          </span>
                          <IoChevronDown className={styles.selectChevron} />
                        </button>
                        {interestOpen && (
                          <ul className={styles.selectDropdown} role="listbox">
                            {interestOptions.map((option) => (
                              <li
                                key={option}
                                role="option"
                                aria-selected={option === values.interest}
                                className={`${styles.selectOption} ${option === values.interest ? styles.selectOptionActive : ""}`}
                                onClick={() => {
                                  setFieldValue("interest", option);
                                  setInterestOpen(false);
                                }}
                              >
                                {option}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {touched.interest && errors.interest && (
                        <p className={styles.error}>{errors.interest}</p>
                      )}
                    </div>

                    <div className={styles.fieldGroup}>
                      <label>Date of Birth</label>
                      <div className={styles.dobWrap} ref={calRef}>
                        <button
                          type="button"
                          className={styles.dobToggle}
                          onClick={() => setCalOpen((p) => !p)}
                        >
                          <span className={values.dob ? styles.selectValue : styles.selectPlaceholder}>
                            {values.dob ? formatDobDisplay(values.dob) : "Select date"}
                          </span>
                          <IoCalendar className={styles.dobIcon} />
                        </button>
                        {calOpen && (
                          <div className={styles.calPopup}>
                            <div className={styles.calHeader}>
                              <button type="button" onClick={prevMonth} className={styles.calNav}>
                                <IoChevronBack />
                              </button>
                              <div className={styles.calTitleGroup}>
                                <button
                                  type="button"
                                  className={styles.calTitleBtn}
                                  onClick={() => { setMonthPickerOpen((p) => !p); setYearPickerOpen(false); }}
                                >
                                  {MONTHS[calMonth]}
                                  <IoChevronDown className={styles.calTitleChevron} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.calTitleBtn}
                                  onClick={() => { setYearPickerOpen((p) => !p); setMonthPickerOpen(false); }}
                                >
                                  {calYear}
                                  <IoChevronDown className={styles.calTitleChevron} />
                                </button>
                              </div>
                              <button type="button" onClick={nextMonth} className={styles.calNav}>
                                <IoChevronForward />
                              </button>
                            </div>

                            {monthPickerOpen ? (
                              <ul className={styles.monthGrid} role="listbox">
                                {MONTHS.map((m, i) => (
                                  <li
                                    key={m}
                                    role="option"
                                    aria-selected={i === calMonth}
                                    className={`${styles.monthOption} ${i === calMonth ? styles.monthOptionActive : ""}`}
                                    onClick={() => {
                                      setCalMonth(i);
                                      setMonthPickerOpen(false);
                                    }}
                                  >
                                    {m.slice(0, 3)}
                                  </li>
                                ))}
                              </ul>
                            ) : yearPickerOpen ? (
                              <ul className={styles.yearGrid} ref={yearListRef} role="listbox">
                                {yearRange.map((y) => (
                                  <li
                                    key={y}
                                    role="option"
                                    aria-selected={y === calYear}
                                    data-active={y === calYear}
                                    className={`${styles.yearOption} ${y === calYear ? styles.yearOptionActive : ""}`}
                                    onClick={() => {
                                      setCalYear(y);
                                      setYearPickerOpen(false);
                                    }}
                                  >
                                    {y}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <>
                            <div className={styles.calDays}>
                              {DAYS.map((d) => (
                                <span key={d} className={styles.calDayLabel}>{d}</span>
                              ))}
                            </div>
                            <div className={styles.calGrid}>
                              {getCalendarDays().map((day, i) => {
                                if (!day) return <span key={`e${i}`} />;
                                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                const isSelected = values.dob === dateStr;
                                const isToday =
                                  day === new Date().getDate() &&
                                  calMonth === new Date().getMonth() &&
                                  calYear === new Date().getFullYear();
                                const isFuture = new Date(calYear, calMonth, day) > new Date();
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    disabled={isFuture}
                                    className={`${styles.calDay} ${isSelected ? styles.calDaySelected : ""} ${isToday && !isSelected ? styles.calDayToday : ""} ${isFuture ? styles.calDayDisabled : ""}`}
                                    onClick={() => {
                                      setFieldValue("dob", dateStr);
                                      setCalOpen(false);
                                    }}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {touched.dob && errors.dob && (
                        <p className={styles.error}>{errors.dob}</p>
                      )}
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="placeOfBirth">Place of Birth</label>
                      <div className={styles.locationWrap}>
                        <div style={{ width: "100%" }}>
                          <LocationSearch
                            value={values.placeOfBirth}
                            onChange={(e) => setFieldValue("placeOfBirth", e.target.value)}
                            onPlaceSelect={({ address }) => setFieldValue("placeOfBirth", address)}
                          />
                        </div>
                        <IoLocation className={styles.locationIcon} />
                      </div>
                    </div>
                  </div>

                  {submitState.status === "error" && (
                    <p className={styles.errorMsg}>{submitState.message}</p>
                  )}

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                  >
                    <IoNotifications />
                    {isSubmitting ? "Submitting..." : "Notify Me"}
                  </button>

                  <p className={styles.privacy}>
                    <IoShieldCheckmark />
                    We respect your privacy. No spam, ever.
                  </p>
                </Form>
              )}
            </Formik>

            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <section className={styles.whatsappSection}>
              <div className={styles.whatsappLeft}>
                <h3>
                  Connect on
                  <span className={styles.green}>WhatsApp</span>
                </h3>
                <p>
                  Scan the QR code to connect with us on WhatsApp and be the first
                  to get exciting updates!
                </p>
              </div>

              <a
                href={WHATSAPP_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.qrCard}
                aria-label="Join our WhatsApp community"
              >
                <div className={styles.qrFrame}>
                  <svg
                    viewBox="0 0 150 150"
                    width="150"
                    height="150"
                    className={styles.qrSvg}
                    aria-hidden="true"
                  >
                    {/* Top-left finder */}
                    <rect x="8" y="8" width="38" height="38" rx="4" fill="#1a1a1a" />
                    <rect x="13" y="13" width="28" height="28" rx="2" fill="#fff" />
                    <rect x="18" y="18" width="18" height="18" rx="2" fill="#1a1a1a" />
                    {/* Top-right finder */}
                    <rect x="104" y="8" width="38" height="38" rx="4" fill="#1a1a1a" />
                    <rect x="109" y="13" width="28" height="28" rx="2" fill="#fff" />
                    <rect x="114" y="18" width="18" height="18" rx="2" fill="#1a1a1a" />
                    {/* Bottom-left finder */}
                    <rect x="8" y="104" width="38" height="38" rx="4" fill="#1a1a1a" />
                    <rect x="13" y="109" width="28" height="28" rx="2" fill="#fff" />
                    <rect x="18" y="114" width="18" height="18" rx="2" fill="#1a1a1a" />
                    {/* Data modules */}
                    <rect x="52" y="8" width="6" height="6" fill="#1a1a1a" />
                    <rect x="64" y="8" width="6" height="6" fill="#1a1a1a" />
                    <rect x="76" y="8" width="6" height="6" fill="#1a1a1a" />
                    <rect x="88" y="8" width="6" height="6" fill="#1a1a1a" />
                    <rect x="52" y="20" width="6" height="6" fill="#1a1a1a" />
                    <rect x="70" y="20" width="6" height="6" fill="#1a1a1a" />
                    <rect x="82" y="20" width="6" height="6" fill="#1a1a1a" />
                    <rect x="52" y="32" width="6" height="6" fill="#1a1a1a" />
                    <rect x="64" y="32" width="6" height="6" fill="#1a1a1a" />
                    <rect x="88" y="32" width="6" height="6" fill="#1a1a1a" />
                    <rect x="58" y="44" width="6" height="6" fill="#1a1a1a" />
                    <rect x="76" y="44" width="6" height="6" fill="#1a1a1a" />
                    <rect x="8" y="52" width="6" height="6" fill="#1a1a1a" />
                    <rect x="20" y="52" width="6" height="6" fill="#1a1a1a" />
                    <rect x="38" y="52" width="6" height="6" fill="#1a1a1a" />
                    <rect x="52" y="52" width="6" height="6" fill="#1a1a1a" />
                    <rect x="88" y="52" width="6" height="6" fill="#1a1a1a" />
                    <rect x="104" y="52" width="6" height="6" fill="#1a1a1a" />
                    <rect x="120" y="52" width="6" height="6" fill="#1a1a1a" />
                    <rect x="136" y="52" width="6" height="6" fill="#1a1a1a" />
                    <rect x="14" y="64" width="6" height="6" fill="#1a1a1a" />
                    <rect x="32" y="64" width="6" height="6" fill="#1a1a1a" />
                    <rect x="58" y="64" width="6" height="6" fill="#1a1a1a" />
                    <rect x="76" y="64" width="6" height="6" fill="#1a1a1a" />
                    <rect x="110" y="64" width="6" height="6" fill="#1a1a1a" />
                    <rect x="130" y="64" width="6" height="6" fill="#1a1a1a" />
                    <rect x="8" y="76" width="6" height="6" fill="#1a1a1a" />
                    <rect x="26" y="76" width="6" height="6" fill="#1a1a1a" />
                    <rect x="44" y="76" width="6" height="6" fill="#1a1a1a" />
                    <rect x="64" y="76" width="6" height="6" fill="#1a1a1a" />
                    <rect x="82" y="76" width="6" height="6" fill="#1a1a1a" />
                    <rect x="104" y="76" width="6" height="6" fill="#1a1a1a" />
                    <rect x="120" y="76" width="6" height="6" fill="#1a1a1a" />
                    <rect x="136" y="76" width="6" height="6" fill="#1a1a1a" />
                    <rect x="20" y="88" width="6" height="6" fill="#1a1a1a" />
                    <rect x="38" y="88" width="6" height="6" fill="#1a1a1a" />
                    <rect x="52" y="88" width="6" height="6" fill="#1a1a1a" />
                    <rect x="70" y="88" width="6" height="6" fill="#1a1a1a" />
                    <rect x="88" y="88" width="6" height="6" fill="#1a1a1a" />
                    <rect x="110" y="88" width="6" height="6" fill="#1a1a1a" />
                    <rect x="130" y="88" width="6" height="6" fill="#1a1a1a" />
                    <rect x="52" y="104" width="6" height="6" fill="#1a1a1a" />
                    <rect x="70" y="104" width="6" height="6" fill="#1a1a1a" />
                    <rect x="82" y="104" width="6" height="6" fill="#1a1a1a" />
                    <rect x="104" y="104" width="6" height="6" fill="#1a1a1a" />
                    <rect x="120" y="104" width="6" height="6" fill="#1a1a1a" />
                    <rect x="52" y="116" width="6" height="6" fill="#1a1a1a" />
                    <rect x="64" y="116" width="6" height="6" fill="#1a1a1a" />
                    <rect x="88" y="116" width="6" height="6" fill="#1a1a1a" />
                    <rect x="110" y="116" width="6" height="6" fill="#1a1a1a" />
                    <rect x="136" y="116" width="6" height="6" fill="#1a1a1a" />
                    <rect x="58" y="130" width="6" height="6" fill="#1a1a1a" />
                    <rect x="76" y="130" width="6" height="6" fill="#1a1a1a" />
                    <rect x="104" y="130" width="6" height="6" fill="#1a1a1a" />
                    <rect x="124" y="130" width="6" height="6" fill="#1a1a1a" />
                    <rect x="136" y="130" width="6" height="6" fill="#1a1a1a" />
                  </svg>
                  <div className={styles.qrCenter}>
                    <IoLogoWhatsapp />
                  </div>
                </div>
                <p className={styles.qrText}>
                  <IoScan />
                  Scan QR Code to Connect
                </p>
              </a>

              <div className={styles.whatsappRight}>
                <h4>
                  <IoLogoWhatsapp />
                  Why Connect on WhatsApp?
                </h4>
                <ul className={styles.benefitsList}>
                  {whatsappBenefits.map((benefit) => (
                    <li key={benefit}>
                      <IoCheckmarkCircle className={styles.checkIcon} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <div className={styles.socialSection}>
              <div className={styles.socialDivider}>
                <span>Stay Connected</span>
              </div>
              <div className={styles.socialIcons}>
                {socialLinks.map(({ label, href, icon }) => {
                  const SocialIcon = icon;

                  return (
                    <a key={label} href={href} aria-label={label}>
                      <SocialIcon />
                    </a>
                  );
                })}
              </div>
            </div>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <img src={ShubhAstroLogo} alt="ShubhAstro" className={styles.footerLogo} />
          <p>© 2026 ShubhAstro Pvt. Ltd. All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoon;
