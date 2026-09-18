import { useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  Sparkles,
  Download,
  Share2,
} from "lucide-react";
import { BsChatDots } from "react-icons/bs";
import { MdOutlinePhoneInTalk } from "react-icons/md";

import { useGetGemStoneReportQuery } from "../../../../redux/api/kundli/planetApi";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import { setForm } from "../../../../redux/kundliform/formSlice";
import verifyDividerImg from "../../../../assets/gemstone-remedy/verify-divider.png";
import CalcReportLoader from "../CalcReportLoader";
import CalcBackButton from "../CalcBackButton";
import RecommendedAstrologersModal from "../../../../component/UI/modal/RecommendedAstrologersModal/RecommendedAstrologersModal";
import useRecommendationOffer from "../../../../utils/hooks/useRecommendationOffer";
import { Toast } from "../../../../component";
import heroFlourish from "../../../../assets/images/rashi/decor/hero-flourish.png";
import heroFlourishLeft from "../../../../assets/images/rashi/decor/hero-flourish-left.png";
// Section-header + essential-tile icons (from the design).
import hdrEssentials from "../../../../assets/gemstone-remedy/hdr-essentials.png";
import hdrBenefits from "../../../../assets/gemstone-remedy/hdr-benefits.png";
import hdrHealth from "../../../../assets/gemstone-remedy/hdr-health.png";
import hdrAlternate from "../../../../assets/gemstone-remedy/hdr-alternate.png";
import hdrAvoid from "../../../../assets/gemstone-remedy/hdr-avoid.png";
import hdrFlaws from "../../../../assets/gemstone-remedy/hdr-flaws.png";
import hdrTime from "../../../../assets/gemstone-remedy/hdr-time.png";
import essPlanet from "../../../../assets/gemstone-remedy/ess-planet.png";
import essOtherName from "../../../../assets/gemstone-remedy/ess-othername.png";
import essFinger from "../../../../assets/gemstone-remedy/ess-finger.png";
import essWeight from "../../../../assets/gemstone-remedy/ess-weight.png";
import essDay from "../../../../assets/gemstone-remedy/ess-day.png";
import essMetal from "../../../../assets/gemstone-remedy/ess-metal.png";
import chipAlternateIcon from "../../../../assets/gemstone-remedy/chip-alternate.png";
import chipAvoidIcon from "../../../../assets/gemstone-remedy/chip-avoid.png";
import hdrMethods from "../../../../assets/gemstone-remedy/hdr-methods.png";
import artSunrise from "../../../../assets/gemstone-remedy/art-sunrise.png";
import artYantra from "../../../../assets/gemstone-remedy/art-yantra.png";
import styles from "./GemstoneRemedy.module.scss";

/*
  Kundli-based Gemstone Remedy report.

  Data flow mirrors the Rashi report and the in-Kundli Gemstones tab: the birth
  form lives in Redux (`state.form.kundliPayload`), is turned into the shared
  vedic params, and drives `useGetGemStoneReportQuery`. The API's single
  `response` object (name, planet, description, good_results, time_to_wear,
  day, mantra, ...) is re-skinned here into the hero / expert-verify / benefit
  layout from the design.

  Note: the gem-suggestion endpoint has no dedicated auspicious-muhurat block,
  so the "Auspicious Muhurat" card is derived honestly from the fields it does
  send (the recommended wearing day + the short "time to wear" line) rather than
  inventing a precise clock time the API never returned.
*/

const titleCase = (value) =>
  String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const GemstoneRemedy = () => {
  const dispatch = useDispatch();

  // Data flow mirrors the in-Kundli Gemstones tab exactly: read the birth form
  // from Redux (`state.form.kundliPayload`), turn it into the shared vedic
  // params, and hit the same `gem-suggestion` endpoint. No login gate — the
  // report shows whatever the shared Kundli form already produced.
  const kundliPayload = useSelector((state) => state?.form?.kundliPayload);

  // The active profile is held in the `kundli` slice and is switched from the
  // global header profile switcher (TopHeader -> setSelectedKundli). When that
  // changes we want this report to re-fetch. The global switcher does NOT touch
  // the `form` slice, so we drive the query directly off `selectedKundli` when
  // it's present, and keep the `form` slice mirrored (for the name heading and
  // consistency with the in-Kundli tab). The saved kundli record already stores
  // hour in 24-hour form, so we build the vedic params from it without a
  // meridiem.
  const selectedKundli = useSelector((state) => state?.kundli?.selectedKundli);

  // Mirror the selected profile into the shared `form` slice so `userDetails`
  // (used for the "<Name>'s Gemstone Remedy" heading) stays in sync.
  useEffect(() => {
    if (!selectedKundli) return;
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const meridiem = selectedKundli.hour >= 12 ? "PM" : "AM";
    const hour12 =
      selectedKundli.hour > 12
        ? selectedKundli.hour - 12
        : selectedKundli.hour === 0
          ? 12
          : selectedKundli.hour;

    dispatch(
      setForm({
        name: selectedKundli.name,
        gender:
          selectedKundli.gender === "male"
            ? "Male"
            : selectedKundli.gender === "female"
              ? "Female"
              : "Others",
        day: String(selectedKundli.day),
        month: months[selectedKundli.month - 1],
        year: String(selectedKundli.year),
        hour: String(hour12),
        minute: String(selectedKundli.min),
        meridiem,
        birthPlace: selectedKundli.place,
        latitude: selectedKundli.lat,
        longitude: selectedKundli.lon,
        timezone: selectedKundli.tzone ?? 5.5,
      })
    );
  }, [selectedKundli, dispatch]);

  // Build the query args. Prefer the freshly selected profile (reacts instantly
  // to the header switcher); fall back to whatever the shared form last held.
  const queryArgs = useMemo(() => {
    if (selectedKundli && selectedKundli.day != null) {
      // Saved kundli records store hour in 24-hour form -> no meridiem.
      return buildVedicParam({
        day: selectedKundli.day,
        month: selectedKundli.month,
        year: selectedKundli.year,
        hour: selectedKundli.hour,
        min: selectedKundli.min,
        lat: selectedKundli.lat,
        lon: selectedKundli.lon,
        tzone: selectedKundli.tzone ?? 5.5,
      });
    }
    return kundliPayload ? buildVedicParam(kundliPayload) : null;
  }, [selectedKundli, kundliPayload]);

  const { data, isLoading } = useGetGemStoneReportQuery(queryArgs || skipToken);

  const gem = data?.response;

  // Call / Chat open the plain recommendation list; closing it reveals the
  // discounted one once. See useRecommendationOffer.
  const recommendation = useRecommendationOffer();

  // The in-page back button shows the discounted offer once as an exit-intent
  // prompt; after that a Back press leaves the report normally.
  const backOfferShownRef = useRef(false);

  const goodResults = useMemo(
    () => (Array.isArray(gem?.good_results) ? gem.good_results.filter(Boolean) : []),
    [gem?.good_results]
  );

  // Redesigned sections all map straight to the gem-suggestion response fields.
  const healthAssociations = useMemo(
    () => (Array.isArray(gem?.diseases_cure) ? gem.diseases_cure.filter(Boolean) : []),
    [gem?.diseases_cure]
  );
  const alternates = useMemo(
    () => (Array.isArray(gem?.substitute) ? gem.substitute.filter(Boolean) : []),
    [gem?.substitute]
  );
  const avoidWith = useMemo(
    () => (Array.isArray(gem?.not_to_wear_with) ? gem.not_to_wear_with.filter(Boolean) : []),
    [gem?.not_to_wear_with]
  );
  const flaws = useMemo(
    () =>
      (Array.isArray(gem?.flaw_results) ? gem.flaw_results : []).filter(
        (f) => f?.flaw_type || f?.flaw_effects
      ),
    [gem?.flaw_results]
  );
  // The six "Gemstone Essentials" tiles (only those the API actually returned).
  const essentials = useMemo(
    () =>
      [
        { icon: essPlanet, label: "Planet", value: gem?.planet },
        { icon: essOtherName, label: "Other Name", value: gem?.other_name },
        { icon: essFinger, label: "Finger", value: gem?.finger },
        { icon: essWeight, label: "Weight", value: gem?.weight },
        { icon: essDay, label: "Day", value: titleCase(gem?.day) },
        { icon: essMetal, label: "Metal", value: gem?.metal },
      ].filter((e) => e.value),
    [gem]
  );

  // Share via the native sheet, falling back to copying the URL.
  const handleShare = async () => {
    const shareData = {
      title: gem?.name ? `${gem.name} — Gemstone Remedy` : "Gemstone Remedy",
      text: gem?.name
        ? `My recommended gemstone is ${gem.name}. Check your gemstone remedy on ShubhAstro.`
        : "Check your gemstone remedy on ShubhAstro.",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      Toast.success("Link copied to clipboard");
    } catch {
      // User dismissed the share sheet, or the API is unavailable — ignore.
    }
  };

  // No PDF pipeline here, so use the browser's print dialog ("Save as PDF").
  const handleDownload = () => window.print();

  if (!queryArgs || isLoading) return <CalcReportLoader />;
  if (!gem) return <div className={styles.empty}>No gemstone recommendation found</div>;

  const wearDay = titleCase(gem.day);

  return (
    <div className={styles.wrapper}>
      {/* Exit-intent offer on the in-page back button (same pattern as Rashi):
            - popup open      -> Back steps back inside it;
            - popup closed and offer not shown yet -> open the discounted offer;
            - offer already shown once -> Back navigates away as usual. */}
      <CalcBackButton
        onBack={() => {
          if (recommendation.isOpen) {
            recommendation.dismiss();
            return true;
          }
          if (!backOfferShownRef.current) {
            backOfferShownRef.current = true;
            recommendation.openOffer("chat");
            return true;
          }
          return false;
        }}
      />


      <div className={styles.layout}>
        {/* HERO lives in its own group (direct child of .layout) so that on
            mobile the Expert Verification sidebar can sit directly beneath the
            hero, above Gemstone Essentials and the rest of the report. On
            desktop this group sits in the left column above .main. */}
        <div className={styles.topGroup}>
          {/* HERO — gem image + name + description (horizontal card) */}
          <section className={styles.hero}>
            <img src={heroFlourish} alt="" aria-hidden="true" className={styles.heroFlourish} />
            <img src={heroFlourishLeft} alt="" aria-hidden="true" className={styles.heroFlourishLeft} />

            <div className={styles.heroCopy}>
              <h2 className={styles.heroTitle}>
                {gem.name}
                {gem.other_name ? <span className={styles.heroOther}> ({gem.other_name})</span> : null}
              </h2>
              {gem.description && <p className={styles.heroText}>{gem.description}</p>}
            </div>
          </section>
        </div>

        {/* ── MAIN COLUMN ─────────────────────────────────────────────── */}
        <div className={styles.main}>
          {/* GEMSTONE ESSENTIALS — icon stat tiles */}
          {essentials.length > 0 && (
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>
                <img src={hdrEssentials} alt="" aria-hidden="true" className={styles.cardTitleImg} />
                Gemstone Essentials
              </h3>
              <div className={styles.essentials}>
                {essentials.map((e) => (
                  <div className={styles.essential} key={e.label}>
                    <img src={e.icon} alt="" aria-hidden="true" className={styles.essentialIcon} />
                    <span className={styles.essentialLabel}>{e.label}</span>
                    <span className={styles.essentialValue}>{e.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* POTENTIAL BENEFITS + TRADITIONAL HEALTH ASSOCIATIONS */}
          {(goodResults.length > 0 || healthAssociations.length > 0) && (
            <div className={styles.pairRow}>
              {goodResults.length > 0 && (
                <section className={styles.card}>
                  <h3 className={styles.cardTitle}>
                    <img src={hdrBenefits} alt="" aria-hidden="true" className={styles.cardTitleImg} />
                    Potential Benefits
                  </h3>
                  <div className={styles.chips}>
                    {goodResults.map((r, i) => (
                      <span className={`${styles.chip} ${styles.chipGreen}`} key={`b-${i}`}>{r}</span>
                    ))}
                  </div>
                </section>
              )}

              {healthAssociations.length > 0 && (
                <section className={styles.card}>
                  <h3 className={styles.cardTitle}>
                    <img src={hdrHealth} alt="" aria-hidden="true" className={styles.cardTitleImg} />
                    Traditional Health Associations
                  </h3>
                  <div className={styles.chips}>
                    {healthAssociations.map((r, i) => (
                      <span className={`${styles.chip} ${styles.chipPink}`} key={`h-${i}`}>{r}</span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ALTERNATE GEMSTONES + AVOID WEARING WITH */}
          {(alternates.length > 0 || avoidWith.length > 0) && (
            <div className={styles.pairRow}>
              {alternates.length > 0 && (
                <section className={styles.card}>
                  <h3 className={styles.cardTitle}>
                    <img src={hdrAlternate} alt="" aria-hidden="true" className={styles.cardTitleImg} />
                    Alternate Gemstones
                  </h3>
                  <div className={styles.chips}>
                    {alternates.map((r, i) => (
                      <span className={`${styles.chip} ${styles.chipViolet}`} key={`a-${i}`}>
                        <img src={chipAlternateIcon} alt="" aria-hidden="true" className={styles.chipIcon} />
                        {r}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {avoidWith.length > 0 && (
                <section className={styles.card}>
                  <h3 className={styles.cardTitle}>
                    <img src={hdrAvoid} alt="" aria-hidden="true" className={styles.cardTitleImg} />
                    Avoid Wearing With
                  </h3>
                  <div className={styles.chips}>
                    {avoidWith.map((r, i) => (
                      <span className={`${styles.chip} ${styles.chipOrange}`} key={`av-${i}`}>
                        <img src={chipAvoidIcon} alt="" aria-hidden="true" className={styles.chipIcon} />
                        {r}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* FLAW TO LOOK OUT FOR — table */}
          {flaws.length > 0 && (
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>
                <img src={hdrFlaws} alt="" aria-hidden="true" className={styles.cardTitleImg} />
                Flaw to Look Out For
              </h3>
              <div className={styles.flawTable}>
                <div className={`${styles.flawRow} ${styles.flawHead}`}>
                  <span className={styles.flawType}>Flaw Type</span>
                  <span className={styles.flawEffect}>Flaw Effects</span>
                </div>
                {flaws.map((f, i) => (
                  <div className={styles.flawRow} key={`fl-${i}`}>
                    <span className={styles.flawType}>{f.flaw_type}</span>
                    <span className={styles.flawEffect}>{f.flaw_effects}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TIME TO WEAR — full-width, with sunrise art on the right */}
          {(gem.time_to_wear || gem.time_to_wear_short || wearDay) && (
            <section className={`${styles.card} ${styles.artCard}`}>
              <img src={artSunrise} alt="" aria-hidden="true" className={styles.artImg} />
              <div className={styles.artBody}>
                <h3 className={styles.cardTitle}>
                  <img src={hdrTime} alt="" aria-hidden="true" className={styles.cardTitleImg} />
                  Time to Wear
                </h3>
                {(gem.time_to_wear_short || wearDay) && (
                  <p className={styles.timeBig}>{gem.time_to_wear_short || `During ${wearDay}`}</p>
                )}
                {gem.time_to_wear && <p className={styles.timeText}>{gem.time_to_wear}</p>}
              </div>
            </section>
          )}

          {/* METHODS (How to Wear) — full-width, with Om-yantra art on the right */}
          {gem.methods && (
            <section className={`${styles.card} ${styles.artCard}`}>
              <img src={artYantra} alt="" aria-hidden="true" className={styles.artImg} />
              <div className={styles.artBody}>
                <h3 className={styles.cardTitle}>
                  <img src={hdrMethods} alt="" aria-hidden="true" className={styles.cardTitleImg} />
                  Methods
                </h3>
                <p className={styles.timeText}>{gem.methods}</p>
              </div>
            </section>
          )}

        </div>

        {/* ── SIDEBAR — EXPERT VERIFICATION ───────────────────────────── */}
        <aside className={styles.sidebar}>
          <div className={styles.verifyCard}>
            <img src={heroFlourish} alt="" aria-hidden="true" className={styles.verifyFlourish} />
            <img src={heroFlourishLeft} alt="" aria-hidden="true" className={styles.verifyFlourishLeft} />

            <div className={styles.cardTools}>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={handleDownload}
                aria-label="Download report"
                title="Download"
              >
                <Download size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={handleShare}
                aria-label="Share report"
                title="Share"
              >
                <Share2 size={15} aria-hidden="true" />
              </button>
            </div>

            <span className={styles.verifyBadge}>
              <Sparkles size={13} aria-hidden="true" /> Expert Verification
            </span>

            <h2 className={styles.verifyHeading}>
              Want an astrologer to verify this recommendation?
            </h2>

            <p className={styles.verifyNote}>
              Connect with an experienced astrologer before choosing or wearing
              your gemstone.
            </p>

            <img src={verifyDividerImg} alt="" aria-hidden="true" className={styles.verifyDivider} />

            <div className={styles.actions}>
              <a
                href="/astrologers"
                className={styles.actionPrimary}
                onClick={(event) => {
                  event.preventDefault();
                  recommendation.open("audio");
                }}
              >
                <MdOutlinePhoneInTalk size={15} aria-hidden="true" /> Call an astrologer
              </a>
              <a
                href="/chat-with-astrologers"
                className={styles.actionSecondary}
                onClick={(event) => {
                  event.preventDefault();
                  recommendation.open("chat");
                }}
              >
                <BsChatDots size={14} aria-hidden="true" /> Chat with astrologer
              </a>
              <button
                type="button"
                className={styles.actionTertiary}
                onClick={() => window.dispatchEvent(new CustomEvent("panditai:ask"))}
              >
                <Sparkles size={14} aria-hidden="true" /> Ask Pandit AI · Free
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile-only fixed action bar. The sidebar's Call/Chat buttons are
          hidden on mobile; these pinned buttons take their place so the two
          primary actions stay reachable while scrolling the report. */}
      <div className={styles.mobileActionBar}>
        <a
          href="/chat-with-astrologers"
          className={styles.mobileActionChat}
          onClick={(event) => {
            event.preventDefault();
            recommendation.open("chat");
          }}
        >
          <BsChatDots size={16} aria-hidden="true" /> Chat with astrologer
        </a>
        <a
          href="/astrologers"
          className={styles.mobileActionCall}
          onClick={(event) => {
            event.preventDefault();
            recommendation.open("audio");
          }}
        >
          <MdOutlinePhoneInTalk size={16} aria-hidden="true" /> Call an astrologer
        </a>
      </div>

      <RecommendedAstrologersModal
        isOpen={recommendation.isOpen}
        variant={recommendation.stage === "offer" ? "offer" : "plain"}
        type={recommendation.type || "chat"}
        onDismiss={recommendation.dismiss}
        onFinish={recommendation.finish}
        onNothingToOffer={recommendation.finish}
        onExitClose={() => {}}
        onExitOffer={() => recommendation.openOffer("chat")}
        returnTo={`${window.location.pathname}${window.location.search}`}
      />
    </div>
  );
};

export default GemstoneRemedy;
