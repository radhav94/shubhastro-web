import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import { logout } from "../../../redux/auth/authSlice";
import { loginWithPhone } from "../../../services/appServices/authService";
import { trackEvent } from "../../../utils/analytics";
import { BranchEvents } from "../../../utils/branchEvents";
import useTruecallerLogin from "./useTruecallerLogin";
import TruecallerLogPanel from "./TruecallerLogPanel";
import { isTruecallerLogViewerEnabled } from "../../../utils/truecaller/truecallerLog";
import { resolvePostLoginRedirect } from "../../../utils/auth/completeCustomerLogin";
import rsBox from "../../../assets/images/rs-box.png";
import loginMobile from "../../../assets/images/login-mobile.png";
import bGuid from "../../../assets/images/b-guidence.png";
import bAstrologer from "../../../assets/images/b-astrology.png";
import bAccurate from "../../../assets/images/b-prediction.png";
import bPrivate from "../../../assets/images/b-private.png";
import {
  getSignupBonusAmount,
  isSignupBonusEnabled,
} from "../../../utils/featureConfig";

// Read once at module scope: an env value cannot change during a session.
const signupBonus = getSignupBonusAmount();
const hasBonus = isSignupBonusEnabled();

const LoginScreen = ({ onNext, onBack, onSkipOtp, formData, updateFormData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumber] = useState(formData.phoneNumber || "");
  const [loading, setLoading] = useState(false);
  // Focused when the CTA is tapped with an incomplete number, so the fix is
  // one keystroke away rather than a hunt back up the page.
  const phoneInputRef = useRef(null);

  /*
    Inline answer for taps that cannot proceed.

    Every decorative-but-tappable region on this screen — the ₹250 offer block,
    the desktop phone mockup, the four trust-bar cells, the +91 chip — used to
    answer with `toast(...)` and a focus move. That reads as a fix, but Clarity
    cannot see a toast: it lives in a portal at the edge of the viewport, is gone
    within seconds, and mutates nothing in the region that was clicked. So every
    one of those taps is still logged as a dead click, and this screen keeps
    coming back in the reports — most recently Chrome desktop, repeated clicks on
    the trust bar at 00:39-00:42 ("Talk to Expert Astrologers"), then the phone
    mockup (alt="ShubhAstro App") at 01:51.

    Worse for the actual user: on desktop the form is in the left column and the
    toast fires top-right, so a click on the mockup on the right produced no
    change anywhere near the cursor.

    The hint renders as a real element directly under the phone input — beside
    the one control that unblocks everything — and the input border lights up
    with it. `seq` increments on every call and is used as the element's React
    key, so a repeat tap on the same target remounts the paragraph and replays
    its animation. Without that, a second tap would set an identical string,
    React would render nothing new, and we would be right back to a dead click.
  */
  const [hint, setHint] = useState(null);
  const showFormHint = (text) => {
    setHint((prev) => ({ text, seq: (prev?.seq || 0) + 1 }));
    phoneInputRef.current?.focus();
  };

  /*
    Truecaller one-tap login. Only offered on Android browsers with a configured
    partner key (Truecaller's mobile-web verification supports Android only), so
    everywhere else this stays hidden and the OTP flow is the single path.
  */
  // Read once on mount: the flag is persisted, and re-reading on every render
  // would re-parse the query string for nothing.
  const [truecallerLogViewer] = useState(isTruecallerLogViewerEnabled);

  const {
    isSupported: isTruecallerAvailable,
    isBusy: truecallerBusy,
    unsupportedReason: truecallerUnsupportedReason,
    status: truecallerStatus,
    loginWithTruecaller,
  } = useTruecallerLogin({
    onLoggedIn: ({ userData, isRegistered, deviceLimitReached }) => {
      // Registered users go to their intended destination. New users continue
      // into the onboarding wizard for profile setup — unless the device limit
      // popup needs to show, which only renders on Home.
      if (isRegistered || deviceLimitReached) {
        navigate(resolvePostLoginRedirect(PATH.privateRoutes.HOME.path), { replace: true });
        return;
      }

      /*
        New user. `onNext()` here used to land them on the OTP step, which is
        wrong twice over: Truecaller has already verified the number (and
        completeCustomerLogin has already stored the session tokens), and no OTP
        was ever sent to it — so the screen asked for a code that does not exist.
        Go straight to profile setup, which is where the OTP path also ends up
        for a new user.
      */
      updateFormData({
        isVerified: true,
        userData,
        // Downstream steps re-normalise this ("^\+?91" stripped, then re-prefixed),
        // so the country-code-prefixed form the API returns is fine as-is.
        ...(userData?.phoneNumber ? { phoneNumber: userData.phoneNumber } : {}),
        // Prefill from the Truecaller profile when the backend forwards it, so
        // the user confirms rather than retypes. Spread conditionally: a blank
        // value here would overwrite nothing, but an explicit `undefined` would
        // still shadow the defaults in Onboarding's formData.
        ...(() => {
          const name = [userData?.firstName, userData?.lastName].filter(Boolean).join(" ").trim();
          return name ? { name } : {};
        })(),
        ...(userData?.email ? { email: userData.email } : {}),
      });
      onSkipOtp();
    },
  });

  // Show device kicked message if redirected from interceptor
  useState(() => {
    const msg = sessionStorage.getItem("shubhtalk_device_kicked");
    if (msg) {
      sessionStorage.removeItem("shubhtalk_device_kicked");
      setTimeout(() => toast.error(msg), 300);
    }
  });

  const handleGetOTP = async () => {
    /*
      A tap while the OTP request is already in flight.

      This was a bare `return`. The CTA itself does change to "Sending…", but
      this handler is shared with the ₹250 offer block — the largest thing on the
      screen, and the element Clarity names — which has no busy state of its own.
      So tapping the offer during the wait produced nothing at all, and the wait
      is a network round trip on a phone connection.

      Clarity filed this session under RAGE clicks (not dead clicks): "Claim ₹250
      Now" at 08:31 and again at 13:16, 57 clicks over 21 minutes, never
      completing authentication. Rapid repeated taps on one control is exactly
      what an unacknowledged in-flight request produces.

      Answered the same way as every other blocked tap on this screen, and the
      same way OTPScreen already answers its own duplicate submit. showFormHint
      keys on an incrementing `seq`, so the third tap re-animates the line rather
      than resolving to an identical render.
    */
    if (loading) {
      showFormHint("Sending your code — one moment.");
      return;
    }

    // This was doubly silent: the button carried `disabled={phoneNumber.length < 10}`
    // so the browser swallowed the tap, and this function also wrapped its whole
    // body in the same check. Tapping the offer CTA with a partial number did
    // nothing whatsoever — at the final step of the signup funnel. Say what's
    // missing and put the cursor back in the field.
    if (phoneNumber.length < 10) {
      trackEvent("login_blocked", {
        blocker: "incomplete_mobile_number",
        digits_entered: phoneNumber.length,
      });
      // Inline, not a toast: this is the last step of the signup funnel and the
      // message has to appear at the field it is about. See showFormHint.
      showFormHint(
        phoneNumber.length === 0
          ? "Enter your 10-digit mobile number to claim the bonus."
          : `Please enter all 10 digits — ${10 - phoneNumber.length} to go.`
      );
      return;
    }

    setLoading(true);
    
    // Track Signup Started event
    BranchEvents.trackSignupStarted({
      page_name: "Login",
      route_name: "login",
      route_path: window.location.pathname,
      signup_method: "phone",
      source: "login_screen",
    });
    
    trackEvent("mobile_number_entered", { mobile_number: phoneNumber, country_code: "91" });
    trackEvent("otp_requested", { mobile_number: phoneNumber });
    try {
      const payload = {
        phoneNumber: `91${phoneNumber}`,
        type: "CUSTOMER",
      };

      const response = await loginWithPhone(payload);

      if (response.data.success && response.data.statusCode === 200) {
        trackEvent("otp_sent", { mobile_number: phoneNumber, delivery_status: "success" });
        toast.success(response.data.message || "OTP sent successfully");
        updateFormData({ phoneNumber });
        onNext();
      } else {
        trackEvent("login_blocked", {
          blocker: "otp_send_failed",
          error_reason: response.data.message || "non_200_response",
        });
        toast.error(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Login error:", error);
      trackEvent("login_blocked", {
        blocker: "otp_send_failed",
        error_reason: error.response?.status
          ? `http_${error.response.status}`
          : error.message || "request_threw",
      });
      toast.error(
        error.response?.data?.message ||
          "Failed to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // The desktop-only phone mockup is a 360x540 screenshot of the app's own UI
  // sitting next to the form. It reads as live interface, so taps land on it and
  // nothing happens. Everything it depicts is behind the sign-in, so answer the
  // tap by pointing at the one control that unlocks it.
  //
  // This is the element Clarity reported as the "ShubhAstro App" click at 01:51
  // — that string is the image's alt text. It was already handled, but with a
  // toast, which is the one kind of answer the metric cannot register.
  const handleMockupClick = () => {
    showFormHint("Enter your mobile number to open this.");
  };

  // The bottom trust bar is four icon + bold-label cells inside a bordered,
  // rounded container with dividers — on mobile a 2x2 grid that reads exactly
  // like a row of tappable feature cards. It had no handlers at all, so taps on
  // it did nothing. Everything it advertises sits behind the sign-in, so answer
  // the tap the same way the phone mockup above does: name the one control that
  // unlocks it and put the cursor there.
  //
  // "Talk to Expert Astrologers" is one of these four cells, and it is what
  // Clarity described as the visitor "exploring astrologer listings" with
  // repeated dead clicks at 00:39-00:42. The toast answer was there already; it
  // just was not visible to the metric or, on desktop, anywhere near the click.
  const handleTrustItemClick = (label) => {
    showFormHint(`${label} — enter your mobile number to get started.`);
  };

  const handleSkipAndProceed = () => {
    dispatch(logout());
    localStorage.removeItem("shubhtalk_redirect_after_login");
    localStorage.removeItem("astro_wallet_balance");
    localStorage.removeItem("shubhtalk_user");
    localStorage.removeItem("shubhtalk_customer_token");
    localStorage.removeItem("shubhtalk_customer_id");
    localStorage.removeItem("selectedKundliProfile");

    /*
     * `replace`, not a push. /login is reached by a plain `navigate("/login")`
     * from ~10 call sites, so it sits in the history stack; pushing the homepage
     * on top of it left the dismissed login wall one Back press away, and a push
     * also truncates the forward entries, so it stayed one Back press away for
     * the rest of the session. Visitors skipped, pressed Back, landed on login,
     * skipped again — the loop shows up as repeated "Skip" plus quick back
     * clicks in session recordings. Replacing the entry means Skip consumes the
     * login screen, and Back returns to whatever they were doing before it.
     */
    navigate(PATH.privateRoutes.HOME.path || "/", { replace: true });
  };

  return (
    <div className={styles.newLoginPage}>
      {/* Main Content */}
      {/* <div className={styles.loginWrapScreen}> */}
      <div className={styles.newLoginHero}>
        {/* Left Section */}
        <div className={styles.newLoginLeft}>
          {/* Online counter */}
          <div className={styles.onlineCounter}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#F75801" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="#F75801" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#F75801" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#F75801" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <b>10K+</b> Astrologers Online
          </div>

          {/*
            Offer Section.

            The gift-box graphic plus "₹250 / RECHARGE / FOR NEW SIGN UPS" is the
            largest thing on this screen and it reads as the offer itself, so it
            gets tapped — and it had no handler at all, so the tap did nothing.
            Every other decorative block here already answers a tap (the phone
            mockup, the trust bar, the +91 chip); this was the last inert one, and
            it is the one that looks most like a claim button.

            Wired to handleGetOTP rather than a bespoke handler so the messaging,
            the focus move and the tracking stay single-sourced with the real CTA:
            with a complete number the tap claims the bonus, and without one it
            says which digits are missing and puts the cursor in the field.

            Pointer-only on purpose — no role/tabIndex. The same action is already
            a labelled control ("Claim ₹250 Now") a few lines below, so a keyboard
            user reaches it without an extra tab stop that announces the same
            thing, and the <h1>/<p> here keep their semantics instead of being
            flattened into a button's accessible name.
          */}
          {/*
            Dropped entirely when the bonus is switched off (amount 0). The block
            is nothing but the offer — gift box, figure, "FOR NEW SIGN UPS" — so
            with no offer to make there is nothing here to soften; rendering it
            would advertise "₹0".
          */}
          {hasBonus && (
          <div
            className={styles.offerSection}
            onClick={handleGetOTP}
            title={`Enter your mobile number to claim ₹${signupBonus}`}
          >
              <img className={styles.giftBox}
                src={rsBox}
                alt="Gift"
                loading="eager"
              />
            <div className={styles.offerText}>
              <h1>
                <span className={styles.rupeeSymbol}>₹</span>
                {signupBonus}
              </h1>
              <p className={styles.rechargeLabel}>RECHARGE</p>
              <p className={styles.forNewSignups}>FOR NEW SIGN UPS</p>
            </div>
          </div>
          )}

          {/*
            Feature Badges.

            Same treatment as the trust bar at the bottom of this screen, and for
            the same reason: a circular bordered icon beside a bold label in a
            divided cell reads as a feature card, so it gets tapped. These two
            were the last pair on the screen still composed that way with no
            handler at all — identical grammar to the trustItem cells a few
            hundred pixels below, which do respond. Clarity has a desktop visit
            from LinkedIn interacting with elements in this column before
            skipping the form entirely.

            Reuses handleTrustItemClick so the wording, the focus move and the
            inline hint stay single-sourced with the other four cells. Real
            <button>s, with the chrome stripped in the stylesheet.
          */}
          <div className={styles.featureBadges}>
            <div className={styles.topLineStart}>
              <b className={styles.bLeft}></b>
              <span className={styles.starIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                  <path d="M14.25 6.75C12.056 4.55601 10.5 0 10.5 0C10.5 0 9.43472 4.25385 7.5 6.5C5.24008 9.1237 0 10 0 10C0 10 4.74008 10.8763 7 13.5C8.93472 15.7461 10.5 20 10.5 20C10.5 20 12.056 15.694 14.25 13.5C16.444 11.306 20.5 10 20.5 10C20.5 10 16.444 8.94398 14.25 6.75Z" fill="#F99A46"/>
                </svg>
              </span>
              <b className={styles.bRight}></b>
            </div>
            <button
              type="button"
              className={styles.featureBadge}
              onClick={() => handleTrustItemClick("Enjoy AI Features")}
            >
              <div className={styles.badgeIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#F75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <strong>Enjoy AI</strong>
                <span>Features</span>
              </div>
            </button>
            <button
              type="button"
              className={styles.featureBadge}
              onClick={() => handleTrustItemClick("Private Sessions")}
            >
              <div className={styles.badgeIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#F75801" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#F75801" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <strong>Private</strong>
                <span>Sessions</span>
              </div>
            </button>
          </div>

          {/* Phone Input */}
          <div
            className={`${styles.newPhoneInput} ${hint ? styles.newPhoneInputHighlight : ""}`.trim()}
          >
            {/*
              Fixed +91. The chevron that used to sit here advertised a country
              picker that does not exist — validation is Indian-format only and
              the backend prefixes "91" — so non-Indian visitors clicked it
              repeatedly and left. Explain on tap rather than imply a choice.
            */}
            <button
              type="button"
              className={styles.newCountryCode}
              onClick={() =>
                showFormHint("We currently support Indian (+91) mobile numbers only.")
              }
              title="Indian (+91) numbers only"
            >
              <img src="https://flagcdn.com/w40/in.png" alt="India" />
              <span>+91</span>
            </button>
            <input
              ref={phoneInputRef}
              type="tel"
              value={phoneNumber}
              autoFocus
              autoComplete="tel-national"
              onChange={(e) => {
                setPhoneNumber(e.target.value.replace(/\D/g, ""));
                // Typing is the response the hint asked for, so clear it rather
                // than leaving stale advice sitting under a field being filled.
                if (hint) setHint(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && phoneNumber.length >= 10 && !loading) {
                  handleGetOTP();
                }
              }}
              placeholder="Enter mobile number"
              maxLength={10}
              inputMode="numeric"
            />
          </div>

          {/*
            role="status" so the message is announced to a screen reader when it
            appears, without stealing focus from the input we just moved the
            cursor into. Keyed on `seq` so a repeated tap remounts it — see
            showFormHint for why that matters.
          */}
          {hint && (
            <p key={hint.seq} className={styles.loginInlineHint} role="status">
              {hint.text}
            </p>
          )}

          {/* CTA Button */}
          <button
            type="button"
            className={`${styles.newClaimBtn} ${phoneNumber.length < 10 ? styles.newClaimBtnIncomplete : ""}`.trim()}
            onClick={handleGetOTP}
            aria-disabled={phoneNumber.length < 10}
            aria-busy={loading}
          >
            {loading
              ? "Sending..."
              : hasBonus
              ? `Claim ₹${signupBonus} Now`
              : "Get OTP"}
            {!loading && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Truecaller one-tap — Android only, hidden elsewhere so the OTP
              flow stays the single visible path on unsupported devices. */}
          {isTruecallerAvailable && (
            <>
              <div className={styles.altLoginDivider}>
                <span>or</span>
              </div>
              <button
                type="button"
                className={styles.truecallerBtn}
                onClick={loginWithTruecaller}
                disabled={truecallerBusy}
                aria-busy={truecallerBusy}
              >
                {/* <span className={styles.truecallerIcon} aria-hidden="true"> */}
                  <svg className={styles.truecallerIcon} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
                  </svg>
                {/* </span> */}
                {truecallerBusy ? "Verifying with Truecaller..." : "Continue with Truecaller"}
              </button>
            </>
          )}

          {/*
            DEV only. The button has three independent gates (partner key, not
            iOS, is Android) and failing any of them just removes it from the
            DOM — which is impossible to diagnose on a phone, where there are no
            devtools and a dev server started before the env was set looks
            exactly like an unsupported device. Stripped from every production
            build by the `import.meta.env.DEV` guard.
          */}
          {(import.meta.env.DEV || truecallerLogViewer) && !isTruecallerAvailable && (
            <p className={styles.truecallerDevHint}>
              Truecaller hidden — {truecallerUnsupportedReason}
              {truecallerUnsupportedReason === "disabled"
                ? " (set VITE_TRUECALLER_ENABLED to \"true\", then restart the dev server)"
                : truecallerUnsupportedReason === "no_partner_key"
                  ? " (set VITE_TRUECALLER_PARTNER_KEY, then restart the dev server)"
                  : ` (UA: ${(navigator.userAgent || "").slice(0, 60)})`}
            </p>
          )}

          {/*
            Diagnostic log viewer. Off unless the tester opened `?tclog=1` once,
            so it never shows for a real user. Needed because this flow only runs
            on a deployed build on a physical Android phone — no devtools, and the
            page may be frozen by the OS while the Truecaller app is in front.
          */}
          {truecallerLogViewer && (
            <TruecallerLogPanel
              isSupported={isTruecallerAvailable}
              unsupportedReason={truecallerUnsupportedReason}
              status={truecallerStatus}
            />
          )}

          {/* Security note */}
          <p className={styles.securityNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 4L12 14.01l-3-3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            100% Secure | Your number is safe with us
          </p>

          {/* Skip */}
          <button className={styles.newSkipLink} onClick={handleSkipAndProceed}>
            Skip
          </button>

          {/* Terms */}
          <p className={styles.newTerms}>
            By submitting, you agree to our{" "}
            <Link to={PATH.privateRoutes.TERMS_CONDITIONS_VIEW.path}>
              Terms & Conditions
            </Link>
          </p>
        </div>

        {/* Right Section - Phone Mockup */}
        <div className={styles.newLoginRight}>
          <button
            type="button"
            className={styles.phoneMockup}
            onClick={handleMockupClick}
            aria-label="Enter your mobile number to open the app"
          >
            <img
              src={loginMobile}
              alt="ShubhAstro App"
              loading="eager"
            />
          </button>
        </div>
        </div>
      {/* </div> */}

      {/* Bottom Trust Bar. Real <button>s: these look like cards and get tapped,
          so the tap now gets an answer instead of silence. Button chrome is
          stripped in the stylesheet. */}
      <div className={styles.trustBar}>
        {[
          { img: bGuid, title: "Personalized", sub: "Guidance" },
          { img: bAstrologer, title: "Talk to Expert", sub: "Astrologers" },
          { img: bAccurate, title: "Accurate", sub: "Predictions" },
          { img: bPrivate, title: "100% Private", sub: "& Secure" },
        ].map(({ img, title, sub }) => (
          <button
            key={title}
            type="button"
            className={styles.trustItem}
            onClick={() => handleTrustItemClick(`${title} ${sub}`)}
          >
              <img src={img} alt="" className={styles.trustIcon} />
            <p>
              <strong>{title}</strong>
              <span>{sub}</span>
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LoginScreen;
