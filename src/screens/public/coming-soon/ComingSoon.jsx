import { useRef, useState, useEffect, useCallback } from "react";
import { Formik, Form, Field } from "formik";
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
import styles from "./ComingSoon.module.scss";

const initialValues = {
  fullName: "",
  mobile: "",
  email: "",
  interest: "",
  dob: "",
  placeOfBirth: "",
};

const interestOptions = ["Astrology", "Numerology", "Tarot", "Vastu", "All"];

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
  const [calYear, setCalYear] = useState(new Date().getFullYear() - 25);
  const calRef = useRef(null);

  const handleSubmit = (values) => {
    console.log("Form submitted:", { ...values, countryCode: selectedCode });
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
    const m = parseInt(month, 10);
    return `${day} ${MONTHS[m - 1]?.slice(0, 3)} ${year}`;
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
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue }) => (
                <Form className={styles.form}>
                  <div className={styles.fieldGrid}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="fullName">Full Name</label>
                      <div className={styles.inputWrap}>
                        <Field
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder="Enter here"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="mobile">Mobile Number</label>
                      <div className={styles.phoneInput}>
                        <div className={styles.countrySelect} ref={codeRef}>
                          <button
                            type="button"
                            className={styles.countryToggle}
                            onClick={() => setCodeOpen((prev) => !prev)}
                            aria-expanded={codeOpen}
                            aria-label="Select country code"
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
                          className={`${styles.input} ${styles.mobileInput}`}
                        />
                      </div>
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
                    </div>

                    <div className={styles.fieldGroup}>
                      <label>I am interested in</label>
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
                              <span className={styles.calTitle}>
                                {MONTHS[calMonth]} {calYear}
                              </span>
                              <button type="button" onClick={nextMonth} className={styles.calNav}>
                                <IoChevronForward />
                              </button>
                            </div>
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
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    className={`${styles.calDay} ${isSelected ? styles.calDaySelected : ""} ${isToday && !isSelected ? styles.calDayToday : ""}`}
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
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="placeOfBirth">Place of Birth</label>
                      <div className={styles.inputWithIcon}>
                        <Field
                          id="placeOfBirth"
                          name="placeOfBirth"
                          type="text"
                          placeholder="Select here"
                          className={styles.input}
                        />
                        <IoLocation className={styles.fieldIcon} />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn}>
                    <IoNotifications />
                    Notify Me
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
