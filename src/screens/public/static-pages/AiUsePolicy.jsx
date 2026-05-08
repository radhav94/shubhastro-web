import React from 'react';
import styles from "./StaticPages.module.scss";
import Divider from '../../../component/Divider';

const AiUsePolicy = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>SHUBHASTRO AI USE POLICY (INDIA)</h1>
      <Divider />

      <h4 className={styles.subtitle}>1. Data Privacy & DPDP Compliance</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Consent Management:</strong> All User data (Birth Date, Time, Location, and Chat History) must be processed based on an affirmative, clear, and granular consent mechanism.</li>
        <li className={styles.listItem}><strong>Purpose Limitation:</strong> Data collected for astrological insights shall not be repurposed for unrelated marketing or sold to third-party data brokers.</li>
        <li className={styles.listItem}><strong>Right to Erasure:</strong> Users must have a clear path to request the deletion of their personal data and AI interaction history ("Right to be Forgotten").</li>
      </ul>

      <h4 className={styles.subtitle}>2. AI Transparency & Disclosure</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Explicit Labeling:</strong> Every AI-driven interaction must be clearly watermarked or labeled (e.g., "Powered by Shubhastro AI" or "Automated Insight").</li>
        <li className={styles.listItem}><strong>Intermediary Disclosure:</strong> In compliance with the latest MeitY advisories, Shubhastro must explicitly inform users about the "inherent fallibility" of AI.</li>
      </ul>

      <h4 className={styles.subtitle}>3. Content Moderation & Legal Safeguards</h4>
      <p className={styles.paragraph}><strong>Prohibited Topics (Safety Filters):</strong> The AI must be hard-coded to refuse queries related to:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}><b>Pre-natal sex determination</b> (strictly prohibited under the PC-PNDT Act).</li>
        <li className={styles.listItem}><b>Medical/Legal/Financial advice</b> (to avoid professional negligence claims).</li>
        <li className={styles.listItem}><b>Death predictions</b> or life-expectancy queries.</li>
      </ul>
      <p className={styles.paragraph}><strong>Intermediary Rules Compliance:</strong> AI must not generate content that is "patently false and untrue" or intended to deceive/mislead users about the reliability of the prediction.</p>

      <h4 className={styles.subtitle}>4. Regulatory Compliance & MeitY Guidelines</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Rule 3(1)(b) Alignment:</strong> The AI must be audited to ensure it does not host, display, or upload content that is defamatory, obscene, or harmful to minors.</li>
        <li className={styles.listItem}><strong>Grievance Redressal:</strong> A dedicated Grievance Officer must be appointed to handle complaints specifically regarding AI-generated outputs, with a response turnaround time of 24–48 hours for urgent "take-down" requests.</li>
        <li className={styles.listItem}><strong>Bias Mitigation:</strong> Regular testing must be conducted to ensure the AI does not show bias based on caste, religion, or gender in its astrological interpretations.</li>
      </ul>

      <h4 className={styles.subtitle}>5. Ethical AI & "Anti-Exploitation"</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Fear-Based Predictions:</strong> The AI is strictly prohibited from using "fear-mongering" tactics (e.g., "You are cursed unless you pay for a remedy") to drive sales or wallet top-ups.</li>
        <li className={styles.listItem}><strong>Vulnerability Protection:</strong> Algorithms must detect and flag "high-distress" keywords (e.g., self-harm, extreme depression) and provide a redirection to professional mental health resources rather than an astrological prediction.</li>
        <li className={styles.listItem}><strong>No Manipulation:</strong> The AI should not use "Dark Patterns" to nudge users into excessive spending or "addictive" chat behavior.</li>
      </ul>

      <h4 className={styles.subtitle}>6. Logging, Monitoring & Audit Trails</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Incident Logging:</strong> All AI-generated responses must be logged with a timestamp and User ID for a minimum of 180 days (as per MeitY's data retention rules).</li>
        <li className={styles.listItem}><strong>Regulatory Access:</strong> In the event of a government request or a legal dispute, Shubhastro must be able to reproduce the exact logic or "prompt" that led to a specific AI output.</li>
      </ul>
    </div>
  );
};

export default AiUsePolicy;
