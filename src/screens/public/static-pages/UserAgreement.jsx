import React from 'react';
import styles from "./StaticPages.module.scss";
import Divider from '../../../component/Divider';

const UserAgreement = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PRIVACY POLICY & USER AGREEMENT</h1>
      <Divider />

      <p className={styles.paragraph}><strong>Effective Date:</strong> April 21, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> April 21, 2026</p>

      <h4 className={styles.subtitle}>1. INTRODUCTION AND SCOPE</h4>
      <p className={styles.paragraph}>Shubhastro ("we," "our," or "us") is committed to protecting and respecting the privacy of our users. This Privacy Policy and User Agreement ("Policy") explains how we collect, use, store, share, and protect your personal data when you use our website, mobile application, and related services (collectively, the "Platform").</p>
      <p className={styles.paragraph}>This Policy is published in compliance with:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>The Information Technology Act, 2000 and the rules thereunder</li>
        <li className={styles.listItem}>The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
        <li className={styles.listItem}>The Digital Personal Data Protection Act, 2023 (DPDPA)</li>
        <li className={styles.listItem}>Any other applicable Indian data protection legislation</li>
      </ul>
      <p className={styles.paragraph}>By using the Platform, you consent to the data practices described in this Policy.</p>
      <p className={styles.paragraph}>Astrological content is shared for entertainment and personal insight only. No guarantee of accuracy is provided. Please do not substitute this information for professional advice of any kind.</p>
      <p className={styles.paragraph}>The Platform provides astrology-based insights and spiritual guidance through artificial intelligence (AI) and human advisors. All services are provided strictly for informational and entertainment purposes.</p>
      <p className={styles.paragraph}>Please be advised that AI-generated outputs have an inherent fallibility and may be unreliable. This system is based on probabilistic algorithms and does not guarantee the accuracy, completeness, or spiritual validity of any prediction. Users are advised to exercise independent judgment and not rely solely on these outputs for critical life decisions.</p>

      <h4 className={styles.subtitle}>2. ELIGIBILITY</h4>
      <p className={styles.paragraph}>The User must be at least 18 years of age and capable of entering into a legally binding agreement under applicable law.</p>

      <h4 className={styles.subtitle}>3. DATA CONTROLLER INFORMATION</h4>
      <p className={styles.paragraph}>Shubhastro acts as the Data Fiduciary/Controller for personal data collected through the Platform.</p>
      <p className={styles.paragraph}><strong>Data Protection Officer / Grievance Officer:</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Name: [Grievance Officer Name]</li>
        <li className={styles.listItem}>Email: <a href="mailto:privacy@shubhastro.com" className={styles.link}>privacy@shubhastro.com</a></li>
        <li className={styles.listItem}>Address: [Registered Address, City, State, PIN, India]</li>
        <li className={styles.listItem}>Response Time: Within 30 days of receipt of complaint, as mandated by applicable law.</li>
      </ul>

      <h4 className={styles.subtitle}>4. INFORMATION WE COLLECT</h4>
      <p className={styles.paragraph}><strong>4.1 Personal Information You Provide</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Name, email address, mobile number, date of birth, gender</li>
        <li className={styles.listItem}>Place and time of birth (required for horoscope generation)</li>
        <li className={styles.listItem}>Profile photograph (optional)</li>
        <li className={styles.listItem}>Payment information (processed via secured third-party payment gateways; we do not store full card details)</li>
        <li className={styles.listItem}>Communication records including chat transcripts, voice, and video call recordings</li>
      </ul>
      <p className={styles.paragraph}><strong>4.2 Sensitive Personal Data or Information (SPDI)</strong></p>
      <p className={styles.paragraph}>In accordance with IT Rules 2011 and DPDPA 2023, the following data collected by us may constitute SPDI:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Financial information including wallet transaction history and payment records</li>
        <li className={styles.listItem}>Health-related questions shared during consultations (such as health concerns discussed with astrologers)</li>
      </ul>
      <p className={styles.paragraph}>We collect SPDI only with your explicit, informed consent and use it solely for service delivery.</p>
      <p className={styles.paragraph}><strong>4.3 Automatically Collected Data</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Device type, operating system, browser, IP address</li>
        <li className={styles.listItem}>Usage data, clickstream data, session duration</li>
        <li className={styles.listItem}>Cookies and tracking technology data</li>
        <li className={styles.listItem}>Location data (approximate, based on IP or GPS if permission granted)</li>
      </ul>

      <h4 className={styles.subtitle}>5. HOW WE USE YOUR INFORMATION</h4>
      <p className={styles.paragraph}>We use your personal data for:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Account creation, verification, and management</li>
        <li className={styles.listItem}>Providing astrology consultations, reports, and services</li>
        <li className={styles.listItem}>Processing payments and maintaining wallet transactions</li>
        <li className={styles.listItem}>Personalizing content, recommendations, and offers</li>
        <li className={styles.listItem}>Customer support, grievance redressal, and feedback management</li>
        <li className={styles.listItem}>Sending transactional notifications, service updates, and promotional communications (with opt-out option)</li>
        <li className={styles.listItem}>Complying with legal obligations and responding to law enforcement requests</li>
        <li className={styles.listItem}>Fraud detection, platform security, and abuse prevention</li>
        <li className={styles.listItem}>Analytics and service improvement</li>
      </ul>

      <h4 className={styles.subtitle}>6. LEGAL BASIS FOR PROCESSING</h4>
      <p className={styles.paragraph}>We process your personal data under the following legal bases as applicable under Indian law:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Your explicit consent provided at registration and during service use</li>
        <li className={styles.listItem}>Performance of the contract between you and Shubhastro</li>
        <li className={styles.listItem}>Compliance with legal obligations</li>
        <li className={styles.listItem}>Legitimate interests of Shubhastro (such as fraud prevention and platform security), subject to your fundamental rights and freedoms</li>
      </ul>

      <h4 className={styles.subtitle}>7. DATA SHARING AND DISCLOSURE</h4>
      <p className={styles.paragraph}><strong>7.1 With Astrologers:</strong> Basic profile information (name, date, time, place of birth) is shared with the astrologer you choose to consult, strictly for the purpose of providing the service.</p>
      <p className={styles.paragraph}><strong>7.2 Service Providers:</strong> We may share data with trusted third-party service providers including payment processors, cloud hosting providers, analytics providers, and customer support platforms, under strict data processing agreements.</p>
      <p className={styles.paragraph}><strong>7.3 Legal Requirement:</strong> We may disclose your data to government authorities, courts, or law enforcement agencies when required by law, court order, or governmental authority in India.</p>
      <p className={styles.paragraph}><strong>7.4 Business Transfer:</strong> In the event of a merger, acquisition, or business transfer, your data may be transferred to the successor entity, subject to the same privacy protections.</p>
      <p className={styles.paragraph}><strong>7.5 No Sale of Data:</strong> Shubhastro does not sell, rent, or trade your personal data to any third party for their marketing purposes.</p>

      <h4 className={styles.subtitle}>8. DATA RETENTION AND CODE OF CONDUCT</h4>
      <p className={styles.paragraph}>We retain your personal data for as long as necessary to fulfill the purposes described in this Policy. Typical retention periods:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Account data: Duration of account + 3 years post-account closure</li>
        <li className={styles.listItem}>Transaction records: 7 years (as required under Indian tax and commercial laws)</li>
        <li className={styles.listItem}>Communication logs: 1 year from date of session</li>
        <li className={styles.listItem}>Grievance records: 3 years from resolution</li>
      </ul>
      <p className={styles.paragraph}>Upon expiry of the retention period, data is securely deleted or anonymized.</p>
      <p className={styles.paragraph}>Users are prohibited from using abusive language, sharing personal contact details with Astrologers, or seeking advice on prohibited topics (e.g., sex of an unborn child, death, or criminal acts).</p>

      <h4 className={styles.subtitle}>9. DATA SECURITY AND INTELLECTUAL PROPERTY (IP)</h4>
      <p className={styles.paragraph}>Shubhastro implements industry-standard technical and organizational security measures to protect your data, including:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>SSL/TLS encryption for all data in transit</li>
        <li className={styles.listItem}>AES-256 encryption for sensitive data at rest</li>
        <li className={styles.listItem}>Role-based access controls for internal data access</li>
        <li className={styles.listItem}>Regular security audits and penetration testing</li>
        <li className={styles.listItem}>Incident response procedures with user notification within 72 hours of a significant breach</li>
      </ul>
      <p className={styles.paragraph}>While we take all reasonable steps to protect your data, no online transmission is 100% secure. Users are responsible for maintaining the security of their account credentials.</p>
      <p className={styles.paragraph}>All outputs generated by AI Astrologers on the Platform, including chat logs, personalized reports, and horoscopes, are the exclusive property of Shubhastro. The User is granted a limited, personal, non-commercial license to view such output. The User shall not use AI-generated content to train external machine learning models or competing AI systems.</p>

      <h4 className={styles.subtitle}>10. YOUR RIGHTS UNDER DPDPA 2023</h4>
      <p className={styles.paragraph}>As a Data Principal (user) under the Digital Personal Data Protection Act, 2023, you have the following rights:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Right to access:</strong> Obtain a summary of your personal data we hold</li>
        <li className={styles.listItem}><strong>Right to correction:</strong> Correct inaccurate or outdated personal data</li>
        <li className={styles.listItem}><strong>Right to erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
        <li className={styles.listItem}><strong>Right to grievance redressal:</strong> Lodge complaints with our Grievance Officer</li>
        <li className={styles.listItem}><strong>Right to nominate:</strong> Nominate a person to exercise your rights in case of death or incapacity</li>
        <li className={styles.listItem}><strong>Right to withdraw consent:</strong> Withdraw consent for data processing (may affect service availability)</li>
      </ul>
      <p className={styles.paragraph}>To exercise your rights, write to us at <a href="mailto:privacy@shubhastro.com" className={styles.link}>privacy@shubhastro.com</a>. We will respond within 30 days.</p>

      <h4 className={styles.subtitle}>11. COOKIES AND TRACKING</h4>
      <p className={styles.paragraph}>We use cookies and similar technologies to enhance your experience on the Platform. Types of cookies:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Essential Cookies:</strong> Necessary for Platform functionality</li>
        <li className={styles.listItem}><strong>Analytical Cookies:</strong> Help us understand usage patterns</li>
        <li className={styles.listItem}><strong>Marketing Cookies:</strong> Used to serve relevant advertisements</li>
      </ul>
      <p className={styles.paragraph}>You can control cookie preferences through your browser settings. Disabling essential cookies may affect Platform functionality.</p>

      <h4 className={styles.subtitle}>12. CHILDREN'S PRIVACY</h4>
      <p className={styles.paragraph}>The Platform is not directed at children under the age of 18. We do not knowingly collect personal data from minors. If we discover that a minor has provided personal data without parental consent, we will promptly delete such data.</p>

      <h4 className={styles.subtitle}>13. CROSS-BORDER DATA TRANSFERS</h4>
      <p className={styles.paragraph}>Your data may be processed on servers located outside India in countries that may have different data protection standards. We ensure adequate safeguards are in place before any cross-border transfer in accordance with DPDPA 2023 and applicable rules.</p>

      <h4 className={styles.subtitle}>14. CHANGES TO THIS POLICY</h4>
      <p className={styles.paragraph}>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or prominent notice on the Platform. Your continued use of the Platform after such changes constitutes acceptance of the revised Policy.</p>

      <h4 className={styles.subtitle}>15. GRIEVANCE REDRESSAL</h4>
      <p className={styles.paragraph}>If you have any grievance related to privacy or data protection, please contact our Grievance Officer at:</p>
      <p className={styles.paragraph}><strong>Email:</strong> <a href="mailto:privacy@shubhastro.com" className={styles.link}>privacy@shubhastro.com</a></p>
      <p className={styles.paragraph}><strong>Address:</strong> [Registered Office Address, City, State, PIN, India]</p>
      <p className={styles.paragraph}>We are committed to resolving your grievance within 30 days of receipt.</p>

      <h4 className={styles.subtitle}>16. INDEMNITY</h4>
      <p className={styles.paragraph}>The User agrees to indemnify, defend, and hold harmless Shubhastro, its parent company, subsidiaries, affiliates, officers, directors, and employees from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorney fees) arising out of or related to the breach of the terms of this Agreement.</p>
      <p className={styles.paragraph}>In no event shall the Platform be liable for any indirect or consequential damages. The total liability of the Platform shall be limited to the amount paid by the User for the specific consultation in question.</p>

      <p className={styles.paragraph} style={{ marginTop: '2rem' }}><strong>ACKNOWLEDGEMENT:</strong> I confirm that I have reviewed the terms in their entirety and hereby accord my unconditional consent to the same. I solemnly affirm that such consent is given without any force, threat, or coercion, and that I am executing this instrument with full knowledge of its legal consequences. </p>
     <p className={styles.paragraph}> By using Shubhastro, you acknowledge that you have read and understood this Privacy Policy and User Agreement.</p>
    </div>
  );
};

export default UserAgreement;
