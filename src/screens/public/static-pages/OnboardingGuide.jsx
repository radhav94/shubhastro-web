import React from 'react';
import styles from "./StaticPages.module.scss";
import Divider from '../../../component/Divider';

const OnboardingGuide = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>USER ONBOARDING GUIDE & PLATFORM DISCLAIMER</h1>
      <Divider />

      <p className={styles.paragraph}><strong>Effective Date:</strong> April 21, 2026</p>

      <h4 className={styles.subtitle}>WELCOME TO SHUBHASTRO</h4>
      <p className={styles.paragraph}>Welcome! We are delighted to have you join the Shubhastro community. This User Onboarding Guide is designed to help you get started on the Platform, understand your rights and responsibilities, and navigate our services with confidence.</p>
      <p className={styles.paragraph}>Please read this document carefully before you begin. By completing registration, you confirm that you have read and agreed to this Guide along with our Terms and Conditions, Privacy Policy, and Refund Policy.</p>

      <h4 className={styles.subtitle}>1. IMPORTANT DISCLAIMER — PLEASE READ FIRST</h4>
      <p className={styles.paragraph}><strong>IMPORTANT:</strong> Shubhastro provides astrological, spiritual, and metaphysical services for ENTERTAINMENT and INFORMATIONAL purposes ONLY. Services do not constitute medical, legal, financial, psychological, or any other regulated professional advice. By engaging with our services, you acknowledge that you are at least 18 years of age and that Shubhastro does not guarantee any specific outcomes. You are solely responsible for your own choices and decisions you make using our Services.</p>
      <p className={styles.paragraph}>Shubhastro and its astrologers do not:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Diagnose, treat, or cure any physical, mental, or medical condition</li>
        <li className={styles.listItem}>Provide legal or financial decisions or guidance</li>
        <li className={styles.listItem}>Guarantee specific outcomes for life events</li>
        <li className={styles.listItem}>Replace professional medical, mental health, or legal consultation</li>
      </ul>
      <p className={styles.paragraph}>Users experiencing health, financial, mental health, or legal emergencies are strongly encouraged to seek appropriate professional help. If you feel you or someone you know is in crisis, please call the national emergency helpline at 112 or mental health helpline iCall at 9152987821.</p>

      <h4 className={styles.subtitle}>2. HOW TO GET STARTED</h4>
      <p className={styles.paragraph}><strong>Step 1: Create Your Account</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Visit www.shubhastro.com or download the Shubhastro mobile app</li>
        <li className={styles.listItem}>Click 'Sign Up' and enter your mobile number or email address</li>
        <li className={styles.listItem}>Verify your OTP</li>
        <li className={styles.listItem}>Complete your profile: name, date of birth, time of birth, and place of birth (needed for accurate readings)</li>
        <li className={styles.listItem}>Upload a profile photo (optional)</li>
      </ul>

      <p className={styles.paragraph}><strong>Step 2: Add Funds to Your Wallet</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Go to 'My Wallet' &gt; 'Add Money'</li>
        <li className={styles.listItem}>Choose your preferred payment method (UPI, card, net banking)</li>
        <li className={styles.listItem}>Minimum recharge amount: Rs. 50/-</li>
        <li className={styles.listItem}>All wallet transactions are secured via PCI-DSS compliant payment gateways</li>
      </ul>

      <p className={styles.paragraph}><strong>Step 3: Choose an Astrologer</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Browse the astrologer directory and filter by expertise, language, price, or rating</li>
        <li className={styles.listItem}>View detailed profiles, user reviews, and availability</li>
        <li className={styles.listItem}>Select your preferred astrologer and consultation mode (chat, call, video)</li>
      </ul>

      <p className={styles.paragraph}><strong>Step 4: Begin Your Consultation</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Ensure your wallet has sufficient balance</li>
        <li className={styles.listItem}>Tap 'Connect' or 'Book Session'</li>
        <li className={styles.listItem}>For live consultations, you will be connected immediately if the astrologer is online, or queued</li>
        <li className={styles.listItem}>Session charges are deducted per minute from your wallet</li>
        <li className={styles.listItem}>You may end the session at any time; charges apply only for time used</li>
      </ul>

      <h4 className={styles.subtitle}>3. UNDERSTANDING YOUR CONSULTATION</h4>
      <p className={styles.paragraph}><strong>3.1 Types of Services</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Live Chat Consultations: Real-time text-based guidance</li>
        <li className={styles.listItem}>Voice Call Consultations: Phone/VoIP-based sessions</li>
        <li className={styles.listItem}>Video Consultations: Face-to-face video sessions</li>
        <li className={styles.listItem}>Personalised Reports: Written horoscope, kundali, and compatibility reports</li>
        <li className={styles.listItem}>Pooja & Remedies: Recommended rituals and products</li>
      </ul>

      <p className={styles.paragraph}><strong>3.2 What to Expect</strong></p>
      <p className={styles.paragraph}>Astrological consultations are based on ancient knowledge systems including Vedic Astrology, Western Astrology, Numerology, Tarot, Vastu, and Palmistry. Results and interpretations are subjective and may vary between practitioners. Shubhastro encourages you to use consultations as a complement to, not a replacement for, practical decision-making. Any reliance you place on such information shall be at your sole risk.</p>

      <p className={styles.paragraph}><strong>3.3 Birth Details Accuracy</strong></p>
      <p className={styles.paragraph}>Accurate birth details (date, exact time, and place of birth) significantly improve the quality of Vedic Astrology readings. Shubhastro is not responsible for discrepancies and/or inaccuracy in the readings resulting from incorrect birth information provided by the user.</p>

      <h4 className={styles.subtitle}>4. RATINGS AND REVIEWS</h4>
      <p className={styles.paragraph}>After each consultation, users are invited to rate their experience (1-5 stars) and leave a review. Reviews help other users make informed choices and help us maintain service quality. By submitting a review, you agree that:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Your review is honest and based on your actual experience</li>
        <li className={styles.listItem}>You will not submit fake, defamatory, or misleading reviews</li>
        <li className={styles.listItem}>Shubhastro may publish your review publicly on the Platform</li>
        <li className={styles.listItem}>Shubhastro may remove reviews that violate our community guidelines</li>
      </ul>

      <h4 className={styles.subtitle}>5. COMMUNICATION AND COMMUNITY GUIDELINES</h4>
      <p className={styles.paragraph}>Shubhastro is a professional and respectful platform. Users must:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Communicate with astrologers respectfully and courteously</li>
        <li className={styles.listItem}>Not share explicit, offensive, or illegal content in sessions</li>
        <li className={styles.listItem}>Not attempt to contact astrologers outside the Platform</li>
        <li className={styles.listItem}>Not misuse the Platform for unauthorized commercial activities</li>
      </ul>
      <p className={styles.paragraph}>Violations may result in account suspension or permanent ban without refund.</p>

      <h4 className={styles.subtitle}>6. ACCOUNT SECURITY</h4>
      <p className={styles.paragraph}>To protect your account:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Use a strong, unique password</li>
        <li className={styles.listItem}>Never share your OTP or login credentials with anyone</li>
        <li className={styles.listItem}>Log out from shared devices</li>
        <li className={styles.listItem}>Report suspicious activity immediately to <a href="mailto:connect@pittiegroup.com" className={styles.link}>connect@pittiegroup.com</a></li>
      </ul>
      <p className={styles.paragraph}>Shubhastro will NEVER ask for your password, full card number, or OTP via call or email.</p>

      <h4 className={styles.subtitle}>7. NOTIFICATIONS AND COMMUNICATIONS</h4>
      <p className={styles.paragraph}>By registering, you consent to receive:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Transactional messages (session confirmations, wallet updates) via SMS/email</li>
        <li className={styles.listItem}>Service notifications via push notifications and in-app messages</li>
        <li className={styles.listItem}>Promotional communications (opt-out available at any time via Profile &gt; Settings &gt; Notifications)</li>
      </ul>
      <p className={styles.paragraph}>Shubhastro is committed to not sharing your contact information with third-party marketers without your consent.</p>

      <h4 className={styles.subtitle}>8. GRIEVANCE REDRESSAL</h4>
      <p className={styles.paragraph}>Your feedback matters to us. For any concerns:</p>

      <p className={styles.paragraph}><strong>8.1 In-App Support</strong></p>
      <p className={styles.paragraph}>Go to: Profile &gt; Help & Support &gt; Raise a Ticket</p>

      <p className={styles.paragraph}><strong>8.2 Email Support</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Email: <a href="mailto:connect@pittiegroup.com" className={styles.link}>connect@pittiegroup.com</a> (for general queries)</li>
        <li className={styles.listItem}>Email: <a href="mailto:grievance@shubhastro.com" className={styles.link}>grievance@shubhastro.com</a> (for formal grievances)</li>
      </ul>

      <p className={styles.paragraph}><strong>8.3 Grievance Officer</strong></p>
      <p className={styles.paragraph}>As required under the Consumer Protection (E-Commerce) Rules, 2020 and IT Act, 2000, our Grievance Officer is:</p>
      <ul className={styles.list}>
        <li className={styles.list}>Name: [Grievance Officer Name]</li>
        <li className={styles.listItem}>Email: <a href="mailto:grievance@shubhastro.com" className={styles.link}>grievance@shubhastro.com</a></li>
        <li className={styles.listItem}>Address: [Registered Office Address, City, State, PIN, India]</li>
        <li className={styles.listItem}>Response Time: Within 48 hours of acknowledgement; resolution within 30 days</li>
      </ul>

      <p className={styles.paragraph}><strong>8.4 Escalation</strong></p>
      <p className={styles.paragraph}>If your grievance is not resolved within 30 days, you may escalate to:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>National Consumer Helpline: 1800-11-4000 or dial 14404</li>
        <li className={styles.listItem}>Consumer Forum under Consumer Protection Act, 2019</li>
        <li className={styles.listItem}>Cyber Crime Portal: www.cybercrime.gov.in (for online fraud or data concerns)</li>
      </ul>

      <h4 className={styles.subtitle}>9. APPLICABLE LAWS</h4>
      <p className={styles.paragraph}>Shubhastro operates in compliance with, including but not limited to:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Consumer Protection Act, 2019 and Consumer Protection (E-Commerce) Rules, 2020</li>
        <li className={styles.listItem}>Information Technology Act, 2000 and IT (Intermediary Guidelines) Rules, 2021</li>
        <li className={styles.listItem}>Digital Personal Data Protection Act, 2023</li>
        <li className={styles.listItem}>Indian Contract Act, 1872</li>
        <li className={styles.listItem}>Goods and Services Tax (GST) framework</li>
        <li className={styles.listItem}>Payment and Settlement Systems Act, 2007 and all applicable laws and regulations</li>
      </ul>

      <h4 className={styles.subtitle}>10. QUICK REFERENCE CONTACT DIRECTORY</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}>General Support: <a href="mailto:connect@pittiegroup.com" className={styles.link}>connect@pittiegroup.com</a></li>
        <li className={styles.listItem}>Grievance Officer: <a href="mailto:grievance@shubhastro.com" className={styles.link}>grievance@shubhastro.com</a></li>
        <li className={styles.listItem}>Legal Notices: <a href="mailto:legal@shubhastro.com" className={styles.link}>legal@shubhastro.com</a></li>
        <li className={styles.listItem}>Privacy / Data Concerns: <a href="mailto:privacy@shubhastro.com" className={styles.link}>privacy@shubhastro.com</a></li>
        <li className={styles.listItem}>Astrologer Partnerships: <a href="mailto:astro-partners@shubhastro.com" className={styles.link}>astro-partners@shubhastro.com</a></li>
        <li className={styles.listItem}>Support Hours: Monday to Saturday, 9:00 AM to 6:00 PM IST</li>
        <li className={styles.listItem}>Registered Address: [Office Address, City, State, PIN, India]</li>
      </ul>
      <p className={styles.paragraph}>I confirm that I have reviewed the terms in their entirety and hereby accord my unconditional consent to the same. I solemnly affirm that such consent is given without any force, threat, or coercion, and that I am executing this instrument with full knowledge of its legal consequences.</p>
      <p className={styles.paragraph} style={{ marginTop: '2rem' }}>By using Shubhastro, you confirm that you have reviewed the terms in their entirety and hereby accord your unconditional consent to the same.</p>
      <p className={styles.paragraph}>Thank you for choosing Shubhastro. We wish you insightful and enriching spiritual experiences.</p>
      <p className={styles.paragraph} style={{ textAlign: 'center', fontStyle: 'italic' }}>Om Shanti. May the stars guide your path.</p>
    </div>
  );
};

export default OnboardingGuide;
