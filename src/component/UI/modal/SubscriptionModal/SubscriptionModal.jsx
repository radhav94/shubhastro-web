import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import styles from "./SubscriptionModal.module.scss";
import { useGetSubscriptionPlansQuery, usePurchaseWalletSubscriptionMutation, useGetSubscriptionStatusQuery } from "../../../../redux/api/subscription/subscriptionApi";
import { getSubscriptionErrorReason, SUBSCRIPTION_REASON } from "../../../../utils/subscription/featureGating";
import { SUBSCRIPTION_EVENTS, trackSubscriptionEvent } from "../../../../utils/subscriptionAnalytics";
import shubhLogoMobile from "../../../../assets/images/mobile-shubh-astro-logo.png";
import welcomeBg from "../../../../assets/images/welcome-bonus-bg.webp";
import welcomeBgMobile from "../../../../assets/images/welcome-bonus-bg-mobile.webp";
import welcomeIcon from "../../../../assets/images/welcome-bonus-icon.webp";
import RechargeModal from "../../../recharge-modal/RechargeModal";

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

const getPurchaseFailureReason = (res) => {
  const explicitReason = getSubscriptionErrorReason(res);
  if (explicitReason) return explicitReason;

  const bodies = [
    res,
    res?.data,
    res?.error,
    res?.error?.data,
    res?.data?.data,
    res?.data?.error,
    res?.error?.data?.data,
    res?.error?.data?.error,
  ];

  for (const body of bodies) {
    if (!body || typeof body !== "object") continue;
    const candidates = [
      body.reason,
      body.code,
      body.message,
      body.error,
      body.error?.code,
      body.error?.reason,
      body.error?.message,
      body.data?.reason,
      body.data?.message,
    ];

    if (
      candidates.some((candidate) =>
        typeof candidate === "string" &&
        /insufficient|low\s+wallet|low\s+balance|wallet\s+balance/i.test(candidate)
      )
    ) {
      return SUBSCRIPTION_REASON.INSUFFICIENT_WALLET_BALANCE;
    }
  }

  return null;
};

/*
  `onInsufficientBalance` is gone. It existed so callers could close this modal
  and get out of the way of a redirect to /recharge; recharging now happens inside
  this modal, so ending the flow at that point is exactly the wrong thing to do.
*/
const SubscriptionModal = ({ isOpen, onClose, onSelectPlan, onPurchased, variant = "basic", plans, featureName = "" }) => {
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
  const [purchaseWallet] = usePurchaseWalletSubscriptionMutation();
  const [pendingCode, setPendingCode] = useState(null);
  const [flow, setFlow] = useState("idle"); // "idle" | "processing" | "success"
  /*
    The plan the user picked when their wallet came up short. Holding the card
    (not just a flag) is what lets the purchase be retried automatically once the
    recharge lands, so they never have to find and pick the same plan again.
  */
  const [rechargeForCard, setRechargeForCard] = useState(null);
  const [successPlan, setSuccessPlan] = useState(null);

  /*
    Synchronous re-entry latch for handleSelect. `pendingCode` only disabled the
    button of the plan being purchased, so while one `purchaseWallet` call was in
    flight a tap on a *different* plan fired a second one — two wallet debits
    from a single visit to the paywall. State updates are async, so a ref is what
    actually closes the window between the two clicks.
  */
  const purchasingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setFlow("idle");
      setSuccessPlan(null);
      setPendingCode(null);
      purchasingRef.current = false;
    }
  }, [isOpen]);

  // #1 SUBSCRIPTION_PAYWALL_SHOWN — fire once each time the dialog opens.
  const purchasedForDismissRef = useRef(false);
  useEffect(() => {
    if (isOpen) {
      purchasedForDismissRef.current = false;
      trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PAYWALL_SHOWN, {
        feature_key: featureName || undefined,
        plan_type: variant,
      });
    }
  }, [isOpen, featureName, variant]);

  // #2 SUBSCRIPTION_PLANS_LOADED — fire once per open when plans are available
  // (either fetched from the API or provided inline for the extended flow).
  const plansLoadedFiredRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      plansLoadedFiredRef.current = false;
      return;
    }
    if (plansLoadedFiredRef.current) return;
    const inline = Array.isArray(plans) && plans.length > 0 ? plans : null;
    const fetched = Array.isArray(data?.data) ? data.data : null;
    const ready = inline || (!isLoading && !isFetching && fetched);
    if (!ready) return;
    const count = inline
      ? inline.length
      : fetched.filter((p) => p.status === "active").length;
    plansLoadedFiredRef.current = true;
    trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PLANS_LOADED, {
      plans_count: count,
      plan_type: variant,
    });
  }, [isOpen, plans, data, isLoading, isFetching, variant]);

  // #6 SUBSCRIPTION_PAYWALL_DISMISSED — user closed the dialog without a
  // successful purchase. Wrap onClose so it fires only on a real dismissal.
  // Declared above the `!isOpen` early return so the Escape effect below can
  // reference it; hooks may not live after a conditional return.
  const handleDismiss = () => {
    if (!purchasedForDismissRef.current && flow !== "success") {
      trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PAYWALL_DISMISSED, {
        feature_key: featureName || undefined,
        plan_type: variant,
      });
    }
    if (onClose) onClose();
  };

  // Escape closes the dialog. It did nothing before — the only way out was the
  // small ✕ in the corner — which left keyboard users with no exit from a
  // role="dialog" aria-modal="true" element. Ignored while a purchase is in
  // flight so a stray keypress cannot abandon a wallet debit mid-flight.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (purchasingRef.current) return;
      handleDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // handleDismiss is re-created each render; `flow` is the only value it reads
    // that changes while open, so re-bind on it to avoid a stale closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, flow]);

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

  /**
   * Recharge finished. Buy the plan the user originally picked, right away.
   *
   * `handleSelect` is safe to re-enter here: its `purchasingRef` guard was
   * released in the `finally` of the failed attempt, and the backend has already
   * credited the wallet by the time RechargeModal reports success.
   */
  const handleRechargeSuccess = () => {
    const card = rechargeForCard;
    setRechargeForCard(null);
    if (card) handleSelect(card);
  };

  /**
   * Recharge dismissed without paying. Stay on the plans list rather than
   * closing everything — the user may want a cheaper plan, and closing here
   * would resolve the caller's pending flow as if they had given up on the
   * feature entirely.
   */
  const handleRechargeDismiss = () => {
    setRechargeForCard(null);
  };

  const handleSelect = async (card) => {
    if (purchasingRef.current) {
      toast.error("Your purchase is still going through — one moment.");
      return;
    }

    // Free plan is not a purchasable subscription.
    if (!card?.plan?.code || card.plan.price === 0) {
      // #8 SUBSCRIPTION_FREE_PLAN_SELECTED
      trackSubscriptionEvent(SUBSCRIPTION_EVENTS.FREE_PLAN_SELECTED, {
        feature_key: featureName || undefined,
      });
      if (onSelectPlan) onSelectPlan(card.plan);
      return;
    }
    // #3 SUBSCRIPTION_PLAN_SELECTED
    trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PLAN_SELECTED, {
      plan_code: card.plan.code,
      plan_name: card.plan.name,
      plan_price: card.priceValue,
      plan_type: variant,
    });
    purchasingRef.current = true;
    setPendingCode(card.id);
    setFlow("processing");
    try {
      const res = await purchaseWallet({ planCode: card.plan.code, device: "web", country: "IN" });
      const body = res?.data || res?.error?.data;
      // The insufficient-balance reason can live in a few shapes depending on
      // the endpoint: data.reason, top-level reason, or error.code.
      const reason = getPurchaseFailureReason(res) || body?.data?.reason || body?.reason || body?.error?.code || body?.error?.reason;
      if (body?.success === true) {
        // #4 SUBSCRIPTION_PURCHASE_SUCCESS
        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_SUCCESS, {
          plan_code: card.plan.code,
          amount: card.priceValue,
        });
        purchasedForDismissRef.current = true;
        setSuccessPlan(card);
        setFlow("success");
        // Plan was paid from the wallet — refresh the wallet balance everywhere.
        window.dispatchEvent(new Event("walletBalanceUpdated"));
        if (onPurchased) onPurchased(card.plan);
      } else if (reason === SUBSCRIPTION_REASON.INSUFFICIENT_WALLET_BALANCE) {
        // #9 SUBSCRIPTION_INSUFFICIENT_BALANCE
        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.INSUFFICIENT_BALANCE, {
          plan_code: card.plan.code,
        });
        setFlow("idle");
        /*
          Recharge in place, then buy the plan — no navigation.

          This used to close the modal and route to /recharge. That threw away
          everything the caller had on screen, and since none of it is persisted
          (no redux-persist in this project), the return trip landed people at the
          start of the flow: a palmistry customer who had just paid was sent back
          to "select hand" with their captured photo gone. It also asked them to
          find their way back and pick the plan again, from a page that had no
          idea what they had been doing.

          Opening RechargeModal over this one keeps the whole flow alive. On
          success we retry the exact same plan straight away, so the user lands on
          their report instead of somewhere upstream.
        */
        setRechargeForCard(card);
      } else if (reason === "AI_WOW_PREMIUM_FLOW_DISABLED") {
        // #5 SUBSCRIPTION_PURCHASE_FAILED
        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_FAILED, {
          plan_code: card.plan.code,
          error_reason: "AI_WOW_PREMIUM_FLOW_DISABLED",
        });
        setFlow("idle");
        toast.error("Subscriptions aren't available right now.");
      } else {
        // #5 SUBSCRIPTION_PURCHASE_FAILED
        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_FAILED, {
          plan_code: card.plan.code,
          error_reason: reason || body?.message || "purchase_failed",
        });
        setFlow("idle");
        toast.error(body?.message || "Purchase failed. Please try again.");
      }
    } catch (err) {
      // #5 SUBSCRIPTION_PURCHASE_FAILED
      trackSubscriptionEvent(SUBSCRIPTION_EVENTS.PURCHASE_FAILED, {
        plan_code: card.plan.code,
        error_reason: err?.message || "exception",
      });
      setFlow("idle");
      toast.error("Purchase failed. Please try again.");
    } finally {
      purchasingRef.current = false;
      setPendingCode(null);
    }
  };

  // Clicking the dimmed backdrop dismisses. It did nothing before, which makes
  // it a guaranteed dead click: reaching for the area outside a dialog is the
  // first thing most people try, and the only real exit was a 22px ✕ in the
  // corner. The target check keeps clicks that merely bubble up from inside the
  // modal from closing it, and a purchase in flight is protected — that tap gets
  // the same message the plan buttons give.
  const handleOverlayClick = (e) => {
    if (e.target !== e.currentTarget) return;
    if (purchasingRef.current) {
      toast.error("Your purchase is still going through — one moment.");
      return;
    }
    handleDismiss();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} style={modalStyle} role="dialog" aria-modal="true" aria-label="Choose Your Subscription">
        <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Close">
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
              {successPlan?.priceValue > 0 && (
                <p className={styles.successDeducted}>
                  ₹{successPlan.priceValue} has been deducted from wallet towards subscription
                </p>
              )}
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

        {/*
          These two states are where the taps go while there is nothing to tap.
          The plans API "occasionally 500s" (see the retry effect above), and
          during that window — up to ~3s of automatic retries — the dialog showed
          a single line of static text where the plan buttons were about to
          appear. Every tap aimed at a plan died silently, which is exactly the
          "several dead clicks, then reached the payment flow" shape.
          aria-busy/role=status announce the wait, and the empty state now offers
          the retry instead of being a dead end behind the ✕.
        */}
        {loading ? (
          <div className={styles.stateMsg} role="status" aria-busy="true">
            Loading plans…
          </div>
        ) : cards.length === 0 ? (
          <div className={styles.stateMsg} role="status">
            <p>
              {isError
                ? "We couldn't load the plans. Check your connection and try again."
                : isExtended
                  ? "No extended plans available right now."
                  : "No plans available right now."}
            </p>
            {!providedPlans && (
              <button
                type="button"
                className={styles.planCtaOutline}
                onClick={() => {
                  plansRetryRef.current = 0;
                  refetch();
                }}
              >
                Try again
              </button>
            )}
          </div>
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

                {/*
                  Never `disabled`: every plan stays clickable and handleSelect
                  names the blocker. While one purchase is in flight the other
                  plans are dimmed too — they used to look fully available even
                  though tapping one would have started a second debit.
                */}
                <button
                  type="button"
                  className={`${styles.planCta} ${plan.highlighted ? styles.planCtaFilled : styles.planCtaOutline}`}
                  onClick={() => handleSelect(plan)}
                  aria-disabled={pendingCode !== null}
                  aria-busy={pendingCode === plan.id}
                >
                  {pendingCode === plan.id ? "Processing..." : plan.cta}
                </button>

                {/* buildFeatures() returns [] when the plan carries no
                    metadata.highlights. Render the whole block only when there
                    is something to list — otherwise the heading sat above an
                    empty list, promising details that never appeared. */}
                {plan.features.length > 0 && (
                  <>
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      {/*
        Rendered inside this modal's overlay so the plans stay mounted underneath:
        the purchase is retried against the same `rechargeForCard` the moment the
        recharge succeeds. Sibling of .modal rather than a child of it, so the
        recharge sheet isn't clipped by the plan card layout.
      */}
      <RechargeModal
        isOpen={!!rechargeForCard}
        onClose={handleRechargeDismiss}
        onSuccess={handleRechargeSuccess}
        /*
          No "wallet topped up" popup here: the recharge is a step towards the
          plan, not the destination. This modal goes straight into "Activating
          your subscription…" and then its own success view, so the wallet popup
          would only add a second screen to dismiss on the way to the report.
        */
        showSuccessPopup={false}
      />
    </div>
  );
};

export default SubscriptionModal;
