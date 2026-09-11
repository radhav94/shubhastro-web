import { memo, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  MessageCircle,
  Phone,
  Heart,
  Briefcase,
  HeartHandshake,
  IndianRupee,
  Home,
  HeartPulse,
  Star,
} from "lucide-react";
import {
  getAstrologerImageUrl,
  getAstrologerDefaultImage,
} from "../../../../utils/appImages";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";
import styles from "./ConnectAstrologerSection.module.scss";

import avatar1 from "../../../../assets/images/community-avatar-1.png";
import avatar2 from "../../../../assets/images/community-avatar-2.png";
import avatar3 from "../../../../assets/images/community-avatar-3.png";
import avatar4 from "../../../../assets/images/community-avatar-4.png";

const CLUSTER_AVATARS = [avatar1, avatar2, avatar3, avatar4];

/* Trust badges under the best-match card. */
const TRUST = [
  {
    line1: "100%",
    line2: "Secure",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#f75801" aria-hidden="true">
        <path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM9 8V6a3 3 0 0 1 6 0v2Z" />
      </svg>
    ),
  },
  {
    line1: "Verified",
    line2: "Experts",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 21" fill="#f75801" aria-hidden="true">
        <path d="M22 10.5 19.56 7.71 19.9 4.02 16.29 3.2 14.4 0 11 1.46 7.6 0 5.71 3.19 2.1 4l.34 3.7L0 10.5l2.44 2.79-.34 3.7 3.61.82L7.6 21 11 19.53 14.4 21l1.89-3.2 3.61-.82-.34-3.69L22 10.5Zm-13.62 4.01-2.38-2.4a1 1 0 0 1 0-1.41l.07-.07a1 1 0 0 1 1.42 0l1.61 1.62 5.15-5.16a1 1 0 0 1 1.42 0l.07.07a1 1 0 0 1 0 1.41l-5.92 5.94a1 1 0 0 1-1.44 0Z" />
      </svg>
    ),
  },
  {
    line1: "Privacy",
    line2: "Protected",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#f75801" aria-hidden="true">
        <path d="M11.3 2.26 5.3 4.51A2 2 0 0 0 4 6.39v4.7c0 4.83 3.13 9.37 7.43 10.75.37.12.77.12 1.14 0C16.87 20.46 20 15.93 20 11.09v-4.7a2 2 0 0 0-1.3-1.87l-6-2.25a2 2 0 0 0-1.4 0Z" />
      </svg>
    ),
  },
];

/* Category slug → pill icon. Falls back to a star for unknown categories. */
const CATEGORY_ICONS = {
  love: Heart,
  career: Briefcase,
  marriage: HeartHandshake,
  finance: IndianRupee,
  money: IndianRupee,
  family: Home,
  health: HeartPulse,
};

const categoryIcon = (cat) => {
  const key = String(cat?.slug || cat?.label || "").toLowerCase();
  return CATEGORY_ICONS[key] || Star;
};

/*
  Home "Connect Astrologer" banner (CMS slug: connect-astrologer).

  Left: kicker + headline (last word accented) + description + category filter
  pills (from sectionData.content) + a stat strip for the selected category.
  Right: the "best match" astrologer for the selected category — the first
  astrologer in that category's `astrologers[]` — with Chat / Call that use the
  real connect flow (onConnect(astrologer, "chat"|"audio")), plus a trust row.
*/
const ConnectAstrologerSection = memo(({ sectionData, onConnect }) => {
  const navigate = useNavigate();

  // Categories come from the CMS section content; each has label/slug/count and
  // an `astrologers` array. Keep only those that actually have astrologers.
  const categories = useMemo(() => {
    const list = Array.isArray(sectionData?.content) ? sectionData.content : [];
    return list.filter((c) => Array.isArray(c?.astrologers) && c.astrologers.length > 0);
  }, [sectionData]);

  const [activeIdx, setActiveIdx] = useState(0);
  const activeCat = categories[activeIdx] || categories[0] || null;
  const bestMatch = activeCat?.astrologers?.[0] || null;

  const heading = sectionData?.display_title || sectionData?.title || "Get Clarity On What Matters Now";
  const desc =
    sectionData?.description ||
    "Choose what you need guidance about and we'll match you with the right astrologer.";

  const goToAstrologers = () => navigate("/astrologers");

  const connect = (type) => {
    if (!bestMatch) {
      goToAstrologers();
      return;
    }
    if (typeof onConnect === "function") onConnect(bestMatch, type);
    else goToAstrologers();
  };

  // Best-match card derived fields.
  const isOnline = bestMatch?.isActive === true;
  const activeTypes = bestMatch?.isActiveType || [];
  const chatOk = isOnline && (activeTypes.includes("all") || activeTypes.includes("chat"));
  const callOk = isOnline && (activeTypes.includes("all") || activeTypes.includes("audio"));
  const specs = (bestMatch?.specialities || [])
    .slice(0, 3)
    .map((s) => (typeof s === "object" ? s.title : s))
    .join(" · ");
  // Rating · price meta line (★ 4.9 · ₹25/min). Sessions aren't in the payload,
  // so we show rating + the lowest per-minute rate.
  const rating = Number(bestMatch?.rating) || 0;
  const bestRate = (() => {
    const rates = [bestMatch?.price?.chatRate?.amount, bestMatch?.price?.audioRate?.amount]
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);
    return rates.length ? Math.min(...rates) : 0;
  })();
  const avatarSrc = bestMatch
    ? getAstrologerImageUrl(bestMatch, "medium") || getAstrologerDefaultImage(bestMatch.gender)
    : "";

  // Render a headline with its last word accented in orange.
  const renderHeading = () => {
    const words = String(heading).trim().split(/\s+/);
    if (words.length <= 1) return <span className={styles.headingAccent}>{heading}</span>;
    // Accent the second word if present (matches "Get Clarity …"), else last.
    const idx = words.length >= 2 ? 1 : words.length - 1;
    return words.map((w, i) =>
      i === idx ? (
        <span key={i} className={styles.headingAccent}>{w} </span>
      ) : (
        <span key={i}>{w} </span>
      )
    );
  };

  return (
    <section className={styles.banner} aria-label="Talk to an astrologer">
      {/* ── Left ── */}
      <div className={styles.left}>
        <span className={styles.kicker}>
          <Sparkles size={14} aria-hidden="true" />
          {sectionData?.title || "Talk To An Astrologer"}
        </span>

        <h2 className={styles.heading}>{renderHeading()}</h2>
        <p className={styles.desc}>{desc}</p>

        {categories.length > 0 && (
          <div className={styles.cats} role="tablist" aria-label="Guidance categories">
            {categories.map((cat, i) => {
              const Icon = categoryIcon(cat);
              return (
                <button
                  key={cat.slug || cat.ID || i}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIdx}
                  className={`${styles.cat} ${i === activeIdx ? styles.catActive : ""}`}
                  onClick={() => setActiveIdx(i)}
                >
                  <Icon size={15} aria-hidden="true" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {activeCat && (
          <div className={styles.stat}>
            <div className={styles.statAvatars}>
              {CLUSTER_AVATARS.map((av, i) => (
                <img key={i} src={av} alt="" className={styles.statAvatar} loading="lazy" />
              ))}
              <span className={styles.statCount}>
                {activeCat.count ? `${activeCat.count}+` : "50+"}
              </span>
            </div>
            <div className={styles.statText}>
              <p className={styles.statTitle}>
                {activeCat.count || activeCat.astrologers.length} astrologers specialize in{" "}
                <span className={styles.accent}>{activeCat.label}</span>
              </p>
              <p className={styles.statSub}>Available now · Avg. 4.8 rating · From ₹{minRate(activeCat)}/min</p>
              <span className={styles.statMeta}>
                <span className={styles.statMetaDot} /> Usually connects fast
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: best-match card ── */}
      {bestMatch && (
        <div className={styles.right}>
          <div className={styles.card}>
            <span className={styles.matchLabel}>
              <Sparkles size={16} aria-hidden="true" /> Best match for{" "}
              <span className={styles.accent}>{activeCat?.label}</span>
            </span>

            <div className={styles.cardTop}>
              <img
                className={styles.cardAvatar}
                src={avatarSrc}
                alt=""
                loading="lazy"
                onError={(e) => { e.currentTarget.src = getAstrologerDefaultImage(bestMatch.gender); }}
              />
              <div className={styles.cardInfo}>
                <p className={styles.cardName}>{getAstrologerDisplayName(bestMatch)}</p>
                {specs && <p className={styles.cardSpecs}>{specs}</p>}
                {(rating > 0 || bestRate > 0) && (
                  <p className={styles.cardMeta}>
                    {rating > 0 && (
                      <span className={styles.cardMetaItem}>
                        <Star size={13} fill="#f5a623" stroke="#f5a623" aria-hidden="true" />
                        {rating.toFixed(1)}
                      </span>
                    )}
                    {bestRate > 0 && <span className={styles.cardMetaItem}>₹{bestRate}/min</span>}
                  </p>
                )}
                <span className={`${styles.cardStatus} ${isOnline ? styles.online : styles.offline}`}>
                  <span className={styles.cardStatusDot} />
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                type="button"
                className={styles.chatBtn}
                onClick={() => connect("chat")}
                disabled={!chatOk}
              >
                <MessageCircle size={20} aria-hidden="true" /> Chat
              </button>
              <button
                type="button"
                className={styles.callBtn}
                onClick={() => connect("audio")}
                disabled={!callOk}
              >
                <Phone size={20} aria-hidden="true" /> Call
              </button>
            </div>

            <div className={styles.trust}>
              {TRUST.map((t) => (
                <span key={t.line1} className={styles.trustItem}>
                  {t.icon}
                  <span className={styles.trustText}>
                    {t.line1}
                    <br />
                    {t.line2}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

/* Lowest per-minute rate across chat/audio for a category's astrologers. */
function minRate(category) {
  const rates = (category?.astrologers || [])
    .flatMap((a) => [a?.price?.chatRate?.amount, a?.price?.audioRate?.amount])
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
  return rates.length ? Math.min(...rates) : 12;
}

ConnectAstrologerSection.displayName = "ConnectAstrologerSection";

export default ConnectAstrologerSection;
