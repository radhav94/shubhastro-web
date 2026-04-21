import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import styles from "./EPoojaBooking.module.scss";
import { FiChevronLeft, FiSearch, FiFilter } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import AstromallCartSidebar from "../components/AstromallCartSidebar";

// ─── DUMMY PANDITS ───
const PANDITS = [
  { _id: "p1", name: "Pt. Ved Sharma", image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p2", name: "Guru Rohan Shastri", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p3", name: "Acharya Lakshmi Kant", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p4", name: "Dr. Vibhusan Patel", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p5", name: "Pt. Ved Sharma", image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p6", name: "Guru Rohan Shastri", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p7", name: "Acharya Lakshmi Kant", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p8", name: "Dr. Vibhusan Patel", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p9", name: "Pt. Ved Sharma", image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p10", name: "Guru Rohan Shastri", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p11", name: "Acharya Lakshmi Kant", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
  { _id: "p12", name: "Dr. Vibhusan Patel", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80", rating: 4.5, experience: 5, skills: "Vedic Kundli · Palmistry · Tarot", languages: ["English", "Hindi"], price: 51000, originalPrice: 58000 },
];

const EPoojaBooking = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();
  const pooja = location.state?.pooja;
  const [search, setSearch] = useState("");

  const filtered = PANDITS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (pandit) => {
    navigate(`/shubhmall/${slug}/payment`, {
      state: { pooja, pandit },
    });
  };

  return (
    <div className={styles.page}>
      {/* ── Top Nav ── */}
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => navigate(`/product-details/${slug}`, { state: pooja })}>
          <span className={styles.backCircle}><FiChevronLeft /></span>
          <span className={styles.backLabel}>{pooja?.title || pooja?.name || "Maha Rudraabhishek Pooja"}</span>
        </button>
        <div className={styles.topRight}>
          <button className={styles.iconBtn} aria-label="Search"><FiSearch /></button>
          <AstromallCartSidebar />
        </div>
      </div>

      {/* ── Heading ── */}
      <h1 className={styles.heading}>SELECT PANDIT</h1>

      {/* ── Search + Filter ── */}
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.filterBtn}>
          <FiFilter /> Filter
        </button>
      </div>

      {/* ── Pandit Grid ── */}
      <div className={styles.grid}>
        {filtered.map((p) => (
          <div key={p._id} className={styles.card}>
            <div className={styles.avatarWrap}>
              <img src={p.image} alt={p.name} className={styles.avatar} />
              <span className={styles.ratingBadge}><FaStar size={10} /> {p.rating}</span>
            </div>
            <h3 className={styles.panditName}>{p.name}</h3>
            <p className={styles.exp}>🏆 {p.experience} years exp.</p>
            <p className={styles.skills}>{p.skills}</p>
            <div className={styles.langs}>
              {p.languages.map((l) => (
                <span key={l} className={styles.langTag}>{l}</span>
              ))}
            </div>
            <div className={styles.priceRow}>
              <div className={styles.priceGroup}>
                <span className={styles.price}>₹{p.price.toLocaleString()}</span>
                <span className={styles.oldPrice}>₹{p.originalPrice.toLocaleString()}</span>
              </div>
              <button className={styles.selectBtn} onClick={() => handleSelect(p)}>Select</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}><p>No pandits found</p></div>
      )}
    </div>
  );
};

export default EPoojaBooking;
