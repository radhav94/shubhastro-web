import { IoClose } from "react-icons/io5";
import styles from "./SubscriptionModal.module.scss";
import { useGetSubscriptionPlansQuery } from "../../../../redux/api/subscription/subscriptionApi";
import shubhLogoMobile from "../../../../assets/images/mobile-shubh-astro-logo.svg";

// Maps API plan `code` -> presentation config. Prices, description and feature
// rows are all driven by the API response (see buildFeatures below).
const PLAN_ORDER = ["free", "premium_monthly", "premium_quarterly"];

const PLAN_DISPLAY = {
  free: {
    title: "One-Time Unlock",
    cta: "Unlock Now",
    highlighted: false,
    priceSource: "overage", // one-time per-report price
  },
  premium_monthly: {
    title: "Monthly Pass",
    cta: "Subscribe",
    highlighted: false,
    priceSource: "price",
  },
  premium_quarterly: {
    title: "Quarterly Pass",
    cta: "Subscribe",
    highlighted: true,
    badge: "Best Value · Save 23%",
    priceSource: "price",
  },
};

// Build the "What's included" rows from real plan fields. If the API ever returns
// a non-empty `features` array, use it directly; otherwise derive sensible rows.
const buildFeatures = (plan) => {
  if (Array.isArray(plan.features) && plan.features.length > 0) {
    return plan.features.map((f) =>
      typeof f === "string"
        ? { label: f, included: true }
        : { label: f.label ?? f.name ?? "", included: f.included !== false }
    );
  }

  const quota = plan.monthlyReportQuota || 0;
  const rows = [
    plan.description ? { label: plan.description, included: true } : null,
    quota > 0
      ? { label: `${quota} reports / month`, included: true }
      : { label: "No monthly report quota", included: false },
    plan.overagePrice != null
      ? { label: `₹${plan.overagePrice} per extra report`, included: true }
      : null,
    plan.durationMonths > 0
      ? { label: `${plan.durationMonths} month${plan.durationMonths > 1 ? "s" : ""} validity`, included: true }
      : { label: "Pay as you go — no validity", included: true },
    { label: plan.gstInclusive ? "GST inclusive" : "GST extra", included: !!plan.gstInclusive },
  ];
  return rows.filter(Boolean);
};

const PlanIcon = () => (
  <img src={shubhLogoMobile} alt="ShubhAstro" className={styles.planLogo} />
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="8.25" stroke="#22A45D" strokeWidth="1.4" />
    <path d="M5.5 9.2l2.2 2.2L12.6 6.5" stroke="#22A45D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="8.25" stroke="#E5484D" strokeWidth="1.4" />
    <path d="M6.4 6.4l5.2 5.2M11.6 6.4l-5.2 5.2" stroke="#E5484D" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const SubscriptionModal = ({ isOpen, onClose, onSelectPlan }) => {
  const { data, isLoading, isFetching } = useGetSubscriptionPlansQuery(undefined, { skip: !isOpen });

  if (!isOpen) return null;

  const apiPlans = Array.isArray(data?.data) ? data.data : [];
  const cards = PLAN_ORDER
    .map((code) => {
      const apiPlan = apiPlans.find((p) => p.code === code && p.status === "active");
      if (!apiPlan) return null;
      const cfg = PLAN_DISPLAY[code];
      const priceValue = cfg.priceSource === "overage" ? apiPlan.overagePrice : apiPlan.price;
      return {
        id: code,
        ...cfg,
        title: apiPlan.name || cfg.title,
        price: `₹${priceValue ?? 0}`,
        features: buildFeatures(apiPlan),
        plan: apiPlan,
      };
    })
    .filter(Boolean);

  const loading = isLoading || isFetching;

  const handleSelect = (card) => {
    if (onSelectPlan) onSelectPlan(card.plan);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Choose Your Subscription">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <IoClose size={22} />
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5l8-3z" fill="#F75801" />
              </svg>
            </span>
            Choose Your Subscription
          </h2>
          <p className={styles.subtitle}>Pick a plan to unlock premium features</p>
        </div>

        {loading ? (
          <div className={styles.stateMsg}>Loading plans…</div>
        ) : cards.length === 0 ? (
          <div className={styles.stateMsg}>No plans available right now.</div>
        ) : (
          <div className={styles.plansGrid}>
            {cards.map((plan) => (
              <div
                key={plan.id}
                className={`${styles.planCard} ${plan.highlighted ? styles.planCardHighlighted : ""}`}
              >
                {plan.badge && (
                  <span className={styles.planBadge}>
                    <span className={styles.badgeStar} aria-hidden="true">★</span>
                    {plan.badge}
                  </span>
                )}

                <div className={styles.planIconBox}>
                  <PlanIcon />
                </div>

                <div className={styles.planHead}>
                  <span className={styles.planTitle}>{plan.title}</span>
                  <span className={styles.planPrice}>{plan.price}</span>
                </div>

                <button
                  type="button"
                  className={`${styles.planCta} ${plan.highlighted ? styles.planCtaFilled : styles.planCtaOutline}`}
                  onClick={() => handleSelect(plan)}
                >
                  {plan.cta}
                </button>

                <div className={styles.divider} />

                <p className={styles.includedTitle}>What&apos;s included ?</p>

                <ul className={styles.featureList}>
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`${styles.featureItem} ${feature.included ? "" : styles.featureExcluded}`}
                    >
                      {feature.included ? <CheckIcon /> : <CrossIcon />}
                      <span>{feature.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionModal;
