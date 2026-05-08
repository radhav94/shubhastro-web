import React from 'react';
import styles from "./StaticPages.module.scss";
import Divider from '../../../component/Divider';

const LiveChatPolicy = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>SHUBHASTRO LIVE CHAT, VOICE & CONTENT MODERATION POLICY</h1>
      <Divider />

      <h4 className={styles.subtitle}>1. Live Chat Monitoring & Fraud Prevention</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Real-time Oversight:</strong> All text-based interactions must be scanned by automated systems for "Commercial Circumvention" (e.g., sharing phone numbers, UPI IDs, or external links to bypass the platform's wallet).</li>
        <li className={styles.listItem}><strong>Misinformation & "Magic" Claims:</strong> Chats are monitored for claims that violate the Drugs and Magical Remedies Act, such as promises to "cure" terminal illnesses or guarantee specific financial windfalls.</li>
        <li className={styles.listItem}><strong>Shadow-Flagging:</strong> High-risk chats (detected by keywords) are silently flagged for a human moderator to review in real-time, allowing for intervention before a user is defrauded.</li>
      </ul>

      <h4 className={styles.subtitle}>2. Voice Call Protocols & Compliance</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Statutory Recording:</strong> In accordance with the IT Amendment Rules 2026, voice calls are recorded and archived for a minimum of 180 days to assist in dispute resolution and regulatory audits.</li>
        <li className={styles.listItem}><strong>Two-Party Consent:</strong> Every call must begin with an automated prompt: "This call is being recorded for quality, safety, and legal compliance purposes." Continuing the call constitutes deemed consent.</li>
        <li className={styles.listItem}><strong>Encrypted Storage:</strong> Recordings must be encrypted at rest and only accessible by authorized "Grievance Officers" or during a legal investigation.</li>
      </ul>

      <h4 className={styles.subtitle}>3. Advanced Profanity & Abuse Filtering</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Multilingual Lexicons:</strong> Filters must support English, Hindi, and regional languages (Marathi, Tamil, etc.) to detect "Hinglish" or transliterated abuse.</li>
        <li className={styles.listItem}><strong>Contextual Blocking:</strong> The system should distinguish between common slang and targeted harassment.</li>
        <li className={styles.listItem}><strong>The "Kill Switch":</strong> Repeated use of blocked profanity during a live session will trigger an automatic "Cooling-Off" period, temporarily suspending the user's ability to chat.</li>
      </ul>

      <h4 className={styles.subtitle}>4. User Safety & Zero-Tolerance Categories</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Anti-Harassment:</strong> Explicit protection against "cyber-stalking" or "gender-based insults" directed at astrologers or users.</li>
        <li className={styles.listItem}><strong>Hate Speech:</strong> Automated blocking of content that promotes enmity between different religious, racial, or linguistic groups.</li>
        <li className={styles.listItem}><strong>Vulnerability Guard:</strong> If the moderation engine detects "Self-Harm" or "Crisis" keywords, it must immediately trigger a system message providing the number of a verified mental health helpline.</li>
      </ul>

      <h4 className={styles.subtitle}>5. Escalation & "Human-in-the-Loop" (HITL)</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Triage Logic:</strong> AI serves as the "triage engine," but final decisions on account bans or legal reporting are made by a Human Moderation Team.</li>
      </ul>

      <h4 className={styles.subtitle}>6. Legal Compliance & The "3-Hour" Rule</h4>
      <ul className={styles.list}>
        <li className={styles.listItem}><strong>Intermediary Due Diligence:</strong> Shubhastro must comply with the applicable laws.</li>
        <li className={styles.listItem}><strong>Preservation of Evidence:</strong> Even if an account is terminated, all logs and recordings must be preserved in a "Digital Chain of Custody" format to be admissible in court.</li>
      </ul>
    </div>
  );
};

export default LiveChatPolicy;
