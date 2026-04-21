import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetAllKundlisQuery } from "../../../../services/appServices/kundliServicesNew";
import { useGetPlanetsQuery } from "../../../../redux/api/kundli/kundliApi";
import styles from "../Home.module.scss";

const formatDate = (day, month, year) => {
  if (!day || !month || !year) return "--";
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
};

const formatTime = (hour, min) => {
  if (hour === undefined || min === undefined) return "--";
  const h = Number(hour);
  const m = Number(min);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

const BirthPanchangSection = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);

  const { data: profilesData, isLoading } = useGetAllKundlisQuery(undefined, {
    skip: !isLoggedIn,
  });

  const profiles = profilesData?.data || [];
  const selfProfile = profiles.find((p) => p.relation === "Self") || profiles[0];
  const profile = selectedKundli?._id
    ? profiles.find((p) => p._id === selectedKundli._id) || selfProfile
    : selfProfile;

  // Build vedic API params from profile (same as Kundli page)
  const vedicParams = profile
    ? {
        dob: `${String(profile.day).padStart(2, "0")}/${String(profile.month).padStart(2, "0")}/${profile.year}`,
        tob: `${String(profile.hour).padStart(2, "0")}:${String(profile.min).padStart(2, "0")}`,
        lat: profile.lat,
        lon: profile.lon,
        tz: profile.tzone,
        lang: "en",
      }
    : null;

  const { data: planetsData, isLoading: planetsLoading } = useGetPlanetsQuery(
    vedicParams || skipToken,
    { skip: !isLoggedIn || !vedicParams }
  );

  if (!isLoggedIn) return null;

  if (isLoading || planetsLoading) {
    return (
      <section className={styles.birthPanchangSection}>
        <div className={styles.birthPanchangHeader}>
          <Calendar size={18} />
          <h2>Birth Details</h2>
        </div>
        <div className={styles.birthPanchangLoading}>Loading birth details...</div>
      </section>
    );
  }

  if (!profile) return null;

  // Use vedic API response (same source as Kundli page Basic tab)
  const birthDetails = planetsData?.response;
  const panchang = birthDetails?.panchang;

  if (!panchang) return null;

  const basicDetails = [
    { label: "Name", value: profile.name || "--" },
    { label: "Place", value: profile.place || "--" },
    { label: "Nakshatra Pada", value: birthDetails?.nakshatra_pada ?? "--" },
    { label: "Date", value: formatDate(profile.day, profile.month, profile.year) },
    { label: "Rasi", value: birthDetails?.rasi || "--" },
    { label: "Day Of Birth", value: panchang.day_of_birth || "--" },
    { label: "Time", value: formatTime(profile.hour, profile.min) },
    { label: "Nakshatra", value: birthDetails?.nakshatra || "--" },
    { label: "Day Lord", value: panchang.day_lord || "--" },
    { label: "Hora Lord", value: panchang.hora_lord || "--" },
    { label: "Tithi", value: panchang.tithi || "--" },
    { label: "Ayanamsha", value: panchang.ayanamsa ? panchang.ayanamsa.toFixed(5) : "--" },
    { label: "Sunrise", value: panchang.sunrise_at_birth || "--" },
    { label: "Yoga", value: panchang.yoga || "--" },
    { label: "Ayanamsha Type", value: panchang.ayanamsa_name || "--" },
    { label: "Sunset", value: panchang.sunset_at_birth || "--" },
    { label: "Karana", value: panchang.karana || "--" },
  ];

  // Split into two blocks: first 9 items (3×3) and remaining
  const block1 = basicDetails.slice(0, 9);
  const block2 = basicDetails.slice(9);

  // Group a flat array into columns (column-wise distribution)
  const groupIntoCols = (items) => {
    const numCols = 3;
    const cols = [[], [], []];
    items.forEach((item, i) => {
      cols[i % numCols].push(item);
    });
    return cols.filter((c) => c.length);
  };

  return (
    <section className={styles.birthPanchangSection} onClick={() => navigate("/kundli")} style={{ cursor: "pointer" }}>
      <div className={styles.birthPanchangHeader}>
        <Calendar size={18} />
        <h2>Birth Details</h2>
        <div className={styles.birthPanchangArrow}>
          <ChevronRight size={22} />
        </div>
      </div>
      <div className={styles.birthPanchangContent}>
        {/* <h3 className={styles.bpSectionTitle}>Basic Details</h3> */}
        {[block1, block2].map((block, bi) => (
          <div key={bi} className={styles.bpDetailsList}>
            {groupIntoCols(block).map((group, gi) => (
              <div key={gi} className={styles.bpDetailGroup}>
                {group.map((item) => (
                  <div key={item.label} className={styles.bpDetailRow}>
                    <span className={styles.bpDetailLabel}>{item.label}</span>
                    <span className={styles.bpDetailValue}>{item.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default BirthPanchangSection;
