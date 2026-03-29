import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFetchAdvancePanchangQuery } from "../../../../redux/api/panchang/panchangApi";
import SectionHeader from "./SectionHeader";
import sun from "../../../../assets/images/sun.png";
import sunriseIcon from "../../../../assets/images/sunrise-icon.svg";
import sunsetIcon from "../../../../assets/images/sunset-icon.svg";
import moonriseIcon from "../../../../assets/images/moonrise-icon.svg";
import moonsetIcon from "../../../../assets/images/moonset-icon.svg";
import styles from "../Home.module.scss";

const formatTime = (time) => {
  if (!time) return "";

  // "7:17:53 AM" → ["7:17:53", "AM"]
  const [clock, meridiem] = time.split(" ");

  // "7:17:53" → ["7", "17", "53"]
  const [hh, mm] = clock.split(":");

  return `${hh}:${mm} ${meridiem}`;
};

const PanchangSection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("today");

  const handleNavigateToPanchang = () => {
    // Calculate the date based on active tab
    const date = new Date();
    let daysOffset = 0;
    
    switch (activeTab) {
      case "tomorrow": 
        daysOffset = 1;
        break;
      case "dayAfter":
        daysOffset = 2;
        break;
      default:
        daysOffset = 0;
    }
    
    date.setDate(date.getDate() + daysOffset);
    
    // Format date as YYYY-MM-DD for date input
    const formattedDate = date.toISOString().split('T')[0];
    
    // Pass date and location data via navigation state
    navigate("/panchang", {
      state: {
        date: formattedDate,
        location: "Mumbai, India",
        latitude: 19.132,
        longitude: 72.342,
      }
    });
  };

  // Helper function to pad numbers
  const pad = (num) => String(num).padStart(2, "0");

  // Calculate dates for each tab
  const getDatePayload = (daysOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);

    return {
      day: pad(date.getDate()),
      month: pad(date.getMonth() + 1),
      year: date.getFullYear(),
      hour: pad(date.getHours()),
      min: pad(date.getMinutes()),
      lat: 19.132,
      lon: 72.342,
      tzone: 5.5,
    };
  };

  // Get payload based on active tab
  const payload = useMemo(() => {
    switch (activeTab) {
      case "today":
        return getDatePayload(0);
      case "tomorrow":
        return getDatePayload(1);
      case "dayAfter":
        return getDatePayload(2);
      default:
        return getDatePayload(0);
    }
  }, [activeTab]);

  // Fetch panchang data
  const { data, isLoading } = useFetchAdvancePanchangQuery(payload);
  const panchangData = data?.response;

  // Format date for third tab
  const getDayAfterTomorrowLabel = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    return `${day}${getDaySuffix(day)} ${month}`;
  };

  const getDaySuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return (
    <section className={styles.panchangSection}>
      <div onClick={handleNavigateToPanchang} style={{ cursor: "pointer" }}>
        <SectionHeader title="EXPLORE PANCHANG" />
      </div>

      <div className={styles.panchangTabs}>
        <button
          className={`${styles.panchangTab} ${activeTab === "today" ? styles.active : ""}`}
          onClick={() => setActiveTab("today")}
        >
          Today
        </button>
        <button
          className={`${styles.panchangTab} ${activeTab === "tomorrow" ? styles.active : ""}`}
          onClick={() => setActiveTab("tomorrow")}
        >
          Tomorrow
        </button>
        <button
          className={`${styles.panchangTab} ${activeTab === "dayAfter" ? styles.active : ""}`}
          onClick={() => setActiveTab("dayAfter")}
        >
          {getDayAfterTomorrowLabel()}
        </button>
      </div>

      {isLoading ? (
        <div className={styles.panchangCard}>
          <div className={styles.panchangHeader}>
            <p>Loading...</p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.panchangCard} onClick={handleNavigateToPanchang} style={{ cursor: "pointer" }}>
            <div className={styles.panchangHeader}>
              <div className={styles.panchangLeft}>
                <h3 className={styles.panchangTitle}>
                  {panchangData?.tithi?.name || "N/A"}
                </h3>
                <p className={styles.panchangSubtitle}>Tithi</p>
              </div>
              <div className={styles.panchangCenter}>
                <img src={sun} alt="Sun" className={styles.sunIcon} />
              </div>
              <div className={styles.panchangRight}>
                <h3 className={styles.panchangTitle}>
                  {panchangData?.nakshatra?.name || "N/A"}
                </h3>
                <p className={styles.panchangSubtitle}>Nakshatra</p>
              </div>
            </div>
          </div>

          <div className={styles.timingsRow} onClick={handleNavigateToPanchang} style={{ cursor: "pointer" }}>
            {/* Sun Timings Card */}
            <div className={styles.timingsCard}>
              <div className={styles.panchangTimings}>
                <div className={styles.timingItem}>
                  <img
                    src={sunriseIcon}
                    alt="Sunrise"
                    className={styles.timingIcon}
                  />
                  <p className={styles.timingTime}>
                    {formatTime(panchangData?.advanced_details?.sun_rise) ||
                      "N/A"}
                  </p>
                  <p className={styles.timingLabel}>Sunrise</p>
                </div>
                <div className={styles.timingDivider}></div>
                <div className={styles.timingItem}>
                  <img
                    src={sunsetIcon}
                    alt="Sunset"
                    className={styles.timingIcon}
                  />
                  <p className={styles.timingTime}>
                    {formatTime(panchangData?.advanced_details?.sun_set) ||
                      "N/A"}
                  </p>
                  <p className={styles.timingLabel}>Sunset</p>
                </div>
              </div>
            </div>

            {/* Moon Timings Card */}
            <div className={styles.timingsCard}>
              <div className={styles.panchangTimings}>
                <div className={styles.timingItem}>
                  <img
                    src={moonriseIcon}
                    alt="Moonrise"
                    className={styles.timingIcon}
                  />
                  <p className={styles.timingTime}>
                    {formatTime(panchangData?.advanced_details?.moon_rise) ||
                      "N/A"}
                  </p>
                  <p className={styles.timingLabel}>Moonrise</p>
                </div>
                <div className={styles.timingDivider}></div>
                <div className={styles.timingItem}>
                  <img
                    src={moonsetIcon}
                    alt="Moonset"
                    className={styles.timingIcon}
                  />
                  <p className={styles.timingTime}>
                    {formatTime(panchangData?.advanced_details?.moon_set) ||
                      "N/A"}
                  </p>
                  <p className={styles.timingLabel}>Moonset</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </section>
  );
};

export default PanchangSection;
