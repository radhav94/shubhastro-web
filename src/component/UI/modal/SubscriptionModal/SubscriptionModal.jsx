import { IoClose } from "react-icons/io5";
import { useEffect, useRef } from "react";
import styles from "./SubscriptionModal.module.scss";
import brandLogo from "../../../../assets/images/mobile-shubh-astro-logo.svg";

// Plan data — placeholder feature copy ("Lorem Ipsum") mirrors the design and is
// easy to swap for real content or API-driven plans later.
const PLANS = [
  {
    id: "one-time",
    title: "One-Time Unlock",
    price: "₹10",
    cta: "Subscribe",
    highlighted: false,
    features: [
      { label: "Single Report · Wallet payment", included: true },
      { label: "Lorem Ipsum", included: true },
      { label: "Lorem Ipsum", included: false },
      { label: "Lorem Ipsum", included: false },
      { label: "Lorem Ipsum", included: false },
      { label: "Lorem Ipsum", included: false },
    ],
  },
  {
    id: "monthly",
    title: "Monthly Pass",
    price: "₹129",
    cta: "Subscribe",
    highlighted: false,
    features: [
      { label: "Single Report · Wallet payment", included: true },
      { label: "Lorem Ipsum", included: true },
      { label: "Lorem Ipsum", included: false },
      { label: "Lorem Ipsum", included: false },
      { label: "Lorem Ipsum", included: false },
      { label: "Lorem Ipsum", included: false },
    ],
  },
  {
    id: "quarterly",
    title: "Quarterly Pass",
    price: "₹299",
    cta: "Subscribe",
    highlighted: true,
    badge: "Best Value · Save 23%",
    features: [
      { label: "Single Report · Wallet payment", included: true },
      { label: "Lorem Ipsum", included: true },
      { label: "Lorem Ipsum", included: true },
      { label: "Lorem Ipsum", included: true },
      { label: "Lorem Ipsum", included: true },
      { label: "Lorem Ipsum", included: true },
    ],
  },
];

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
  const plansGridRef = useRef(null);
  const highlightedPlanRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 900px)").matches) return;

    const frame = window.requestAnimationFrame(() => {
      const grid = plansGridRef.current;
      const highlightedCard = highlightedPlanRef.current;
      if (!grid || !highlightedCard) return;

      grid.scrollLeft =
        highlightedCard.offsetLeft -
        (grid.clientWidth - highlightedCard.offsetWidth) / 2;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (plan) => {
    if (onSelectPlan) onSelectPlan(plan);
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
                <path d="M5.4 5.2h13.2L22 10.1 12 22 2 10.1l3.4-4.9Z" fill="#F75801" />
                <path d="m5.4 5.2 2.8 4.9L12 5.2l3.8 4.9 2.8-4.9M2 10.1h20M8.2 10.1 12 22l3.8-11.9" stroke="#FF8A4C" strokeWidth="0.8" strokeLinejoin="round" />
              </svg>
            </span>
            Unlock Premium Features
          </h2>
          <p className={styles.subtitle}>Choose a plan to continue</p>
        </div>

        <div className={styles.plansGrid} ref={plansGridRef}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              ref={plan.highlighted ? highlightedPlanRef : null}
              className={`${styles.planCard} ${plan.highlighted ? styles.planCardHighlighted : ""}`}
            >
              {plan.badge && (
                <span className={styles.planBadge}>
                  <span className={styles.badgeStar} aria-hidden="true">★</span>
                  {plan.badge}
                </span>
              )}

              <div className={styles.planIconBox}>
                <img src={brandLogo} alt="" aria-hidden="true" />
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
      </div>
    </div>
  );
};

export default SubscriptionModal;
