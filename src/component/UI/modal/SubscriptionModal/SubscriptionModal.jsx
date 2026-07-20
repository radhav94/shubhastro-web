import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import styles from "./SubscriptionModal.module.scss";
import { useGetSubscriptionPlansQuery, usePurchaseWalletSubscriptionMutation, useGetSubscriptionStatusQuery } from "../../../../redux/api/subscription/subscriptionApi";
import shubhLogoMobile from "../../../../assets/images/mobile-shubh-astro-logo.svg";
import welcomeBg from "../../../../assets/images/welcome-bonus-bg.webp";
import welcomeBgMobile from "../../../../assets/images/welcome-bonus-bg-mobile.webp";
import welcomeIcon from "../../../../assets/images/welcome-bonus-icon.webp";

// Build the "What's included" rows straight from the API response — the
// marketing bullets in `metadata.highlights`. No derived defaults; whatever the
// API sends is what we show. (The `features` key is reserved for other use.)
const buildFeatures = (plan) => {
  const highlights = plan.metadata?.highlights;
  if (Array.isArray(highlights) && highlights.length > 0) {
    return highlights
      .map((h) => (typeof h === "string" ? { label: h, included: true } : null))
      .filter((row) => row && row.label);
  }
  return [];
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

const SubscriptionModal = ({ isOpen, onClose, onSelectPlan, onPurchased, variant = "basic", plans }) => {
  const isExtended = variant === "extended";

  // Extended plans are returned inline by the generate/report response. When the
  // caller passes them via `plans`, use them directly and skip the plans API.
  const providedPlans = Array.isArray(plans) && plans.length > 0 ? plans : null;

  // Fallback (no inline plans): the extended plans API needs the user's CURRENT
  // plan code to return the correct pack(s).
  const customerToken = typeof window !== "undefined" ? localStorage.getItem("shubhtalk_customer_token") : null;
  const { data: statusData } = useGetSubscriptionStatusQuery(undefined, {
    skip: !isOpen || !isExtended || !customerToken || !!providedPlans,
  });
  const currentPlanCode = statusData?.data?.subscription?.planCode;

  const plansQuery = useGetSubscriptionPlansQuery(
    isExtended ? { planType: "extended", planCode: currentPlanCode } : undefined,
    { skip: !isOpen || !!providedPlans || (isExtended && !currentPlanCode) }
  );
  const { data, isLoading, isFetching, isError, error, refetch } = plansQuery;

  // The plans API occasionally 500s — retry it automatically (a few times) so
  // the popup can still load without the user having to reopen it.
  const plansRetryRef = useRef(0);
  useEffect(() => {
    const status = error?.status ?? error?.originalStatus;
    if (isError && status === 500 && plansRetryRef.current < 3) {
      plansRetryRef.current += 1;
      const timer = setTimeout(() => refetch(), 1000);
      return () => clearTimeout(timer);
    }
    if (!isError) plansRetryRef.current = 0;
  }, [isError, error, refetch]);

  const navigate = useNavigate();
  const [purchaseWallet] = usePurchaseWalletSubscriptionMutation();
  const [pendingCode, setPendingCode] = useState(null);
  const [flow, setFlow] = useState("idle"); // "idle" | "processing" | "success"
  const [successPlan, setSuccessPlan] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFlow("idle");
      setSuccessPlan(null);
      setPendingCode(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const apiPlans = providedPlans || (Array.isArray(data?.data) ? data.data : []);
  const cards = isExtended
    ? apiPlans
        // Inline plans from the response are already the valid pack(s) and may
        // not carry a `status` field, so only status-filter API-fetched plans.
        .filter((p) => providedPlans || p.status === "active")
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.price ?? 0) - (b.price ?? 0))
        .map((p) => ({
          id: p.code,
          title: p.name,
          cta: "Buy Now",
          highlighted: false,
          price: `₹${p.price ?? 0}`,
          priceValue: Number(p.price) || 0,
          features: buildFeatures(p),
          plan: p,
        }))
    : apiPlans
        .filter((p) => p.status === "active" && !(p.planType === "extended" || (p.code || "").startsWith("extended")))
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.price ?? 0) - (b.price ?? 0))
        .map((p, idx, arr) => {
          // Prefer the API-provided badge (e.g. "Best value"); otherwise fall
          // back to highlighting the last / highest-sortOrder plan.
          const apiBadge = p.metadata?.badge;
          const anyApiBadge = arr.some((x) => x.metadata?.badge);
          const highlighted = apiBadge ? true : (!anyApiBadge && arr.length > 1 && idx === arr.length - 1);
          return {
            id: p.code,
            title: p.name,
            cta: (p.price ?? 0) > 0 ? "Subscribe" : "Unlock Now",
            highlighted,
            badge: apiBadge || (highlighted ? "Best Value" : undefined),
            price: `₹${p.price ?? 0}`,
            priceValue: Number(p.price) || 0,
            features: buildFeatures(p),
            plan: p,
          };
        });

  const loading = providedPlans ? false : (isLoading || isFetching);

  // Size the modal to the number of cards so it hugs them (no leftover side
  // space) while keeping each card a fixed, consistent width. Cards wrap and
  // the modal is capped by its max-width when there are many plans.
  // card 300px + 20px gap, horizontal padding 76px (38 * 2).
  const columns = Math.min(Math.max(cards.length, 1), 4);
  // The processing/success state views are simple centered messages — keep them
  // compact instead of inheriting the wide multi-plan grid width.
  const isStateView = flow === "processing" || flow === "success";
  // When there are more cards than fit in one row (columns capped at 4), trim
  // the modal width by ~half a card so the next card peeks through, hinting the
  // row is horizontally scrollable (mobile-carousel style).
  const peek = cards.length > columns ? 150 : 0;
  const modalStyle = flow === "success"
    ? { "--modal-w": "min(480px, 100%)" }
    : isStateView
      ? { "--modal-w": "min(420px, 100%)" }
      : { "--modal-w": `min(${columns * 300 + (columns - 1) * 20 + 76 - peek}px, 100%)` };

  const handleSelect = async (card) => {
    // Free plan is not a purchasable subscription.
    if (!card?.plan?.code || card.plan.price === 0) {
      if (onSelectPlan) onSelectPlan(card.plan);
      return;
    }
    setPendingCode(card.id);
    setFlow("processing");
    try {
      const res = await purchaseWallet({ planCode: card.plan.code, device: "web", country: "IN" });
      const body = res?.data || res?.error?.data;
      const reason = body?.data?.reason || body?.reason;
      if (body?.success === true) {
        setSuccessPlan(card);
        setFlow("success");
        // Plan was paid from the wallet — refresh the wallet balance everywhere.
        window.dispatchEvent(new Event("walletBalanceUpdated"));
        if (onPurchased) onPurchased(card.plan);
      } else if (reason === "INSUFFICIENT_WALLET_BALANCE") {
        setFlow("idle");
        toast.error("Insufficient wallet balance. Please recharge to continue.");
        if (onClose) onClose();
        navigate("/recharge");
      } else if (reason === "AI_WOW_PREMIUM_FLOW_DISABLED") {
        setFlow("idle");
        toast.error("Subscriptions aren't available right now.");
      } else {
        setFlow("idle");
        toast.error(body?.message || "Purchase failed. Please try again.");
      }
    } catch {
      setFlow("idle");
      toast.error("Purchase failed. Please try again.");
    } finally {
      setPendingCode(null);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={modalStyle} role="dialog" aria-modal="true" aria-label="Choose Your Subscription">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <IoClose size={22} />
        </button>

        {flow === "processing" ? (
          <div className={styles.stateView}>
            <div className={styles.spinner} />
            <h3 className={styles.stateTitle}>Activating your subscription…</h3>
            <p className={styles.stateText}>Please wait while we confirm your plan.</p>
          </div>
        ) : flow === "success" ? (
          <div className={styles.successCelebrate}>
            <div className={styles.successBgWrapper}>
              <img src={welcomeBg} alt="" className={`${styles.successBg} ${styles.successBgDesktop}`} />
              <img src={welcomeBgMobile} alt="" className={`${styles.successBg} ${styles.successBgMobile}`} />
            </div>
            <div className={styles.successContent}>
              <img src={welcomeIcon} alt="Success" className={styles.successIconImg} />
              <p className={styles.successWelcome}>Payment Successful!</p>
              <h2 className={styles.successTitle}>Subscription Activated</h2>
              {successPlan?.title && <p className={styles.successPlanName}>{successPlan.title}</p>}
              <div className={styles.successBadge}>
                <span aria-hidden="true">✦</span> Premium features unlocked
              </div>
              <p className={styles.successDesc}>
                You&apos;re all set! Enjoy your Shubh AI reports and continue your journey.
              </p>
              <button type="button" className={styles.successBtn} onClick={onClose}>
                Continue
              </button>
            </div>
          </div>
        ) : (
          <>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5l8-3z" fill="#F75801" />
              </svg>
            </span>
            {isExtended ? "Extend Your Reports" : "Choose Your Subscription"}
          </h2>
          <p className={styles.subtitle}>{isExtended ? "Your plan limit is exhausted. Pick an extended plan to continue." : "Pick a plan to unlock premium features"}</p>
        </div>

        {loading ? (
          <div className={styles.stateMsg}>Loading plans…</div>
        ) : cards.length === 0 ? (
          <div className={styles.stateMsg}>{isExtended ? "No extended plans available right now." : "No plans available right now."}</div>
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
                  {plan.priceValue > 0 && <span className={styles.planPrice}>{plan.price}</span>}
                </div>

                <button
                  type="button"
                  className={`${styles.planCta} ${plan.highlighted ? styles.planCtaFilled : styles.planCtaOutline}`}
                  onClick={() => handleSelect(plan)}
                  disabled={pendingCode === plan.id}
                >
                  {pendingCode === plan.id ? "Processing..." : plan.cta}
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
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionModal;
