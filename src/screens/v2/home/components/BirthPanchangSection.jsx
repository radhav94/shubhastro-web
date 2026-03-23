import { useSelector } from "react-redux";
import { Calendar } from "lucide-react";
import { useGetAllKundlisQuery } from "../../../../services/appServices/kundliServicesNew";
import styles from "../Home.module.scss";

const formatTo12Hr = (time) => {
  if (!time || time === "--") return "--";
  const [hh, mm] = time.split(":");
  const h = parseInt(hh, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${mm} ${period}`;
};

const BirthPanchangSection = () => {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const { data: profilesData, isLoading } = useGetAllKundlisQuery(undefined, {
    skip: !isLoggedIn,
  });

  if (!isLoggedIn) return null;

  const profiles = profilesData?.data || [];
  // Prefer "Self" relation, fallback to first profile
  const profile = profiles.find((p) => p.relation === "Self") || profiles[0];

  if (isLoading) {
    return (
      <section className={styles.birthPanchangSection}>
        <div className={styles.birthPanchangHeader}>
          <Calendar size={18} />
          <h2>Birth Panchang</h2>
        </div>
        <div className={styles.birthPanchangLoading}>Loading birth panchang...</div>
      </section>
    );
  }

  if (!profile) return null;

  const panchang = profile.kundliSnapshotId?.panchang;
  if (!panchang) return null;

  const panchangCards = [
    { icon: "🌙", label: "TITHI", value: panchang?.tithi || "--", sub: panchang?.tithi},
    { icon: "⭐", label: "NAKSHATRA", value: panchang.nakshatra || profile.nakshatra || "--" },
    { icon: "🕉️", label: "YOGA", value: panchang.yoga || "--" },
    { icon: "⚡", label: "KARANA", value: panchang.karana || "--" },
    { icon: "📅", label: "VAAR", value: panchang.day_of_birth || "--" },
  ];
  

  const sunSign = profile.sunSign || panchang.sunSign || "--";
  const moonSign = profile.moonSign || panchang.moonSign || "--";
  const moonNakshatra = profile.nakshatra || panchang.nakshatra || "--";
  const sunrise = formatTo12Hr(panchang.sunrise_at_birth) || "--";
  const sunset = formatTo12Hr(panchang.sunset_at_birth) || "--";
  const profileName = profile?.name || panchang?.name ;

  
  return (
    <section className={styles.birthPanchangSection}>
      <div className={styles.birthPanchangHeader}>
        <Calendar size={18} />
        <h2>Birth Panchang</h2>
      </div>

      <div className={styles.birthPanchangContent}>
        <div className={styles.birthPanchangCards}>
          {panchangCards.map((card) => (
            <div key={card.label} className={styles.birthPanchangCard}>
              <div className={styles.bpCardLabel}>
                <span className={styles.bpCardIcon}>{card.icon}</span>
                <span>{card.label}</span>
              </div>
              <div className={styles.bpCardValue}>{card.value}</div>
              {card.sub && <div className={styles.bpCardSub}>{card.sub}</div>}
            </div>
          ))}
        </div>

        <div className={styles.birthPanchangPlanets}>
          <div className={styles.birthPlanetCard}>
            <div className={styles.planetHeader}>
              <span className={styles.planetIcon}>☀️</span>
              <span className={styles.planetName}>Sun</span>
            </div>
            <div className={styles.planetDetails}>
              <span className={styles.planetDetail}>Sign: <strong>{sunSign}</strong></span>
              <span className={styles.planetDetail}>☼ <strong>{sunrise}</strong></span>
              <span className={styles.planetDetail}>☽ <strong>{sunset}</strong></span>
            </div>
          </div>

          <div className={styles.birthPlanetCard}>
            <div className={styles.planetHeader}>
              <span className={styles.planetIcon}>🌙</span>
              <span className={styles.planetName}>Moon</span>
            </div>
            <div className={styles.planetDetails}>
              <span className={styles.planetDetail}>Sign: <strong>{moonSign}</strong></span>
              <span className={styles.planetDetail}>Nakshatra: <strong>{moonNakshatra}</strong></span>
              <span className={styles.planetDetail}>Paksha: <strong>{profileName}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BirthPanchangSection;
