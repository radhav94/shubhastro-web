import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./PolicyView.module.scss";

const TermsConditionsView = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>Terms & Conditions</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.updateInfo}>
          <p className={styles.updateText}>Last Updated: 18th September 2026</p>
        </div>

        <div className={styles.section}>
          <p className={styles.paragraph}>
            Welcome to ShubhAstro. These Terms & Conditions ("Terms") govern your use of our
            mobile application, website, products, and services ("Platform"). By accessing or using
            the Platform, you agree to be bound by these Terms.
          </p>
          <p className={styles.paragraph}>
            If you do not agree, please do not use the Platform.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Eligibility</h2>
          <p className={styles.paragraph}>
            You must be 18 years or older to create an account and use ShubhAstro. By registering,
            you confirm that the information you provide is accurate and true.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Nature of Services</h2>
          <p className={styles.paragraph}>ShubhAstro provides:</p>
          <ul className={styles.list}>
            <li>Access to astrologers for consultations</li>
            <li>Birth chart/Kundli generation</li>
            <li>Tarot, numerology, and related esoteric services</li>
            <li>Content, reports, and predictions</li>
          </ul>
          <p className={styles.paragraph}>
            All predictions are advisory in nature. They are not guaranteed outcomes and should
            not replace professional advice such as medical, legal, or financial counsel.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. User Account</h2>
          <p className={styles.paragraph}>
            To use ShubhAstro, you may need to register using your mobile number and OTP
            verification. You are responsible for maintaining the confidentiality of your account
            credentials and for all activities that occur under your account.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Payment and Refunds</h2>
          <p className={styles.paragraph}>
            Services may be offered as free or paid. Payment terms, wallet usage, and refund
            policies are governed by our separate Pricing and Refund Policy documents.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. User Conduct</h2>
          <p className={styles.paragraph}>You agree not to:</p>
          <ul className={styles.list}>
            <li>Use the Platform for any unlawful purpose</li>
            <li>Harass, abuse, or harm astrologers or other users</li>
            <li>Share false or misleading information</li>
            <li>Attempt to gain unauthorized access to the Platform</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Whatsapp Consent</h2>
          <p className={styles.paragraph}>
             By signing up, you agree to receive updates, offers and promotional communications from ShubhAstro on WhatsApp.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Intellectual Property</h2>
          <p className={styles.paragraph}>
            All content, including text, graphics, logos, and software, is the property of
            ShubhAstro or its licensors. You may not reproduce, distribute, or create derivative
            works without our express written permission.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Limitation of Liability</h2>
          <p className={styles.paragraph}>
            ShubhAstro is not liable for any direct, indirect, incidental, or consequential
            damages arising from your use of the Platform. Services are provided "as is" without
            warranties of any kind.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Termination</h2>
          <p className={styles.paragraph}>
            We reserve the right to suspend or terminate your account at any time for violation
            of these Terms or for any other reason at our discretion.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Changes to Terms</h2>
          <p className={styles.paragraph}>
            We may update these Terms from time to time. Continued use of the Platform after
            changes constitutes acceptance of the updated Terms.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Contact Us</h2>
          <p className={styles.paragraph}>
            For questions about these Terms, please contact us at{" "}
            <a href="mailto:connect@pittiegroup.com" className={styles.link}>
              connect@pittiegroup.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsView;
