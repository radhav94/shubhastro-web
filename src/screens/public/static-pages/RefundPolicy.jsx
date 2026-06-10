import React from 'react';
import styles from "./StaticPages.module.scss";
import Divider from '../../../component/Divider';

const RefundPolicy = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>REFUND AND CANCELLATION POLICY</h1>
      <Divider />

      <p className={styles.paragraph}><strong>Effective Date:</strong> April 21, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> April 21, 2026</p>

      <h4 className={styles.subtitle}>1. OVERVIEW</h4>
      <p className={styles.paragraph}>Shubhastro strives to deliver high-quality spiritual and astrological services. We understand that questions about refunds and cancellations are important for our users. This Refund and Cancellation Policy outlines the conditions under which refunds are granted or denied.</p>
      <p className={styles.paragraph}>This Policy is applicable to all services offered on the Platform and should be read in conjunction with our Terms and Conditions. Shubhastro reserves the right to amend this Policy at any time, with updates posted on the Platform.</p>

      <h4 className={styles.subtitle}>2. WALLET RECHARGE AND PAYMENTS</h4>
      <p className={styles.paragraph}><strong>2.1 Prepaid Wallet System</strong></p>
      <p className={styles.paragraph}>All paid services on Shubhastro operate through a prepaid wallet system. Users must add funds to their Shubhastro Wallet before availing any paid consultation or service. Wallet credits are:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Non-transferable between accounts</li>
        <li className={styles.listItem}>Not convertible to cash except as outlined in this Policy</li>
        <li className={styles.listItem}>Valid for 12 months from the date of last recharge or activity</li>
        <li className={styles.listItem}>Subject to applicable GST at the time of recharge</li>
      </ul>
      <p className={styles.paragraph}><strong>2.2 Payment Methods</strong></p>
      <p className={styles.paragraph}>Shubhastro accepts payment through major UPI platforms, debit/credit cards, net banking, and digital wallets via PCI-DSS compliant third-party payment gateways. Shubhastro does not store payment card details on its servers.</p>

      <h4 className={styles.subtitle}>3. REFUND ELIGIBILITY</h4>
      <p className={styles.paragraph}><strong>3.1 ELIGIBLE Cases for Refund</strong></p>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table || ''} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Situation</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Refund Amount</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Processing Time</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }}>Session could not connect due to technical fault on Shubhastro's end</td>
              <td style={{ padding: '0.75rem' }}>Full consultation amount refunded to wallet</td>
              <td style={{ padding: '0.75rem' }}>Within 48 hours</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }}>Astrologer disconnects within first 2 minutes without resolution</td>
              <td style={{ padding: '0.75rem' }}>Full session amount refunded to wallet</td>
              <td style={{ padding: '0.75rem' }}>Within 48 hours</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }}>Duplicate payment / double deduction</td>
              <td style={{ padding: '0.75rem' }}>Duplicate amount refunded to original payment source</td>
              <td style={{ padding: '0.75rem' }}>5-7 business days</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }}>Payment deducted but wallet not credited</td>
              <td style={{ padding: '0.75rem' }}>Amount credited to wallet</td>
              <td style={{ padding: '0.75rem' }}>Within 24 hours</td>
            </tr>
            <tr>
              <td style={{ padding: '0.75rem' }}>Account closure by user with remaining wallet balance</td>
              <td style={{ padding: '0.75rem' }}>Unused wallet balance refunded after verification</td>
              <td style={{ padding: '0.75rem' }}>7-10 business days</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className={styles.paragraph}><strong>3.2 NON-ELIGIBLE Cases (No Refund)</strong></p>
      <p className={styles.paragraph}>Refunds will NOT be provided in the following circumstances:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>User disconnects a session voluntarily before completion</li>
        <li className={styles.listItem}>User is dissatisfied with the content or quality of the consultation (subjective in nature)</li>
        <li className={styles.listItem}>Session was successfully completed as per platform logs</li>
        <li className={styles.listItem}>User did not attend a scheduled callback or session at the agreed time</li>
        <li className={styles.listItem}>Refund requested after 7 days of the transaction date</li>
        <li className={styles.listItem}>Account suspended for violation of Terms and Conditions</li>
        <li className={styles.listItem}>Promotional credits, cashback credits, or bonus wallet amounts</li>
        <li className={styles.listItem}>Purchased reports, kundali documents, or digital downloads that have been delivered</li>
        <li className={styles.listItem}>Pooja bookings where preparations have commenced</li>
        <li className={styles.listItem}>For service interruptions caused by 'Acts of God,' government regulations, or internet service provider (ISP) failures on the User's end. Shubhastro’s platform logs shall be the final authority in determining whether a session was successfully delivered.</li>
        <li className={styles.listItem}>If the User is found to be engaging in 'Friendly Fraud' (filing a dispute with a bank despite receiving the service) or if the User has a history of multiple refund requests across Shubhastro or partner platforms.</li>
      </ul>

      <h4 className={styles.subtitle}>4. CONSULTATION CANCELLATION</h4>
      <p className={styles.paragraph}><strong>4.1 Cancellation by User</strong></p>
      <p className={styles.paragraph}>Users may cancel a scheduled consultation session subject to the following:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Cancellation more than 24 hours before scheduled time: Full refund to Shubhastro Wallet</li>
        <li className={styles.listItem}>Cancellation between 2-24 hours before scheduled time: 50% refund to wallet</li>
        <li className={styles.listItem}>Cancellation within 2 hours of scheduled time: No refund</li>
        <li className={styles.listItem}>No-show (user absent at session time): No refund</li>
      </ul>
      <p className={styles.paragraph}><strong>4.2 Cancellation by Astrologer:</strong> If an astrologer cancels a pre-booked session, the user will receive a full refund to their Shubhastro Wallet and will be offered priority rebooking with the same or equivalent astrologer.</p>
      <p className={styles.paragraph}><strong>4.3 Cancellation by Shubhastro:</strong> Shubhastro reserves the right to cancel sessions in cases of astrologer unavailability due to emergency, platform technical issues, or violation of platform conduct guidelines. In such cases, a full refund will be credited to the user's wallet.</p>

      <h4 className={styles.subtitle}>5. REFUND PROCESS</h4>
      <p className={styles.paragraph}><strong>5.1 How to Request a Refund</strong></p>
      <p className={styles.paragraph}>To initiate a refund claim:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Log in to your Shubhastro account and navigate to "Help" &gt; "Raise a Complaint"</li>
        <li className={styles.listItem}>Alternatively, email <a href="mailto:connect@pittiegroup.com" className={styles.link}>connect@pittiegroup.com</a> with subject line "Refund Request - [Order/Transaction ID]"</li>
        <li className={styles.listItem}>Include your registered email/phone, transaction ID, date of transaction, and reason for refund</li>
      </ul>
      <p className={styles.paragraph}><strong>5.2 Processing Timeline</strong></p>
      <p className={styles.paragraph}>Upon submission of a valid refund request:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Refund to Shubhastro Wallet: Within 24-48 business hours</li>
        <li className={styles.listItem}>Refund to original payment source (bank account, card, UPI): 5-10 business days</li>
        <li className={styles.listItem}>Shubhastro is not responsible for delays caused by the user's bank or payment provider</li>
      </ul>
      <p className={styles.paragraph}><strong>5.3 Refund to Original Source:</strong> Refunds to the original payment source are only applicable in cases of failed transactions, duplicate payments, or account closure. For all other eligible cases, refunds are credited to the Shubhastro Wallet.</p>

      <h4 className={styles.subtitle}>6. PROMOTIONAL CREDITS AND OFFERS</h4>
      <p className={styles.paragraph}>Promotional credits, discount coupons, cashback, referral bonuses, and free session credits:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Are non-refundable and non-transferable</li>
        <li className={styles.listItem}>Cannot be converted to cash</li>
        <li className={styles.listItem}>Are subject to specific terms communicated at the time of the offer</li>
        <li className={styles.listItem}>May be forfeited upon expiry or account termination</li>
      </ul>

      <h4 className={styles.subtitle}>7. CHARGEBACKS AND PAYMENT DISPUTES</h4>
      <p className={styles.paragraph}>Initiating a chargeback through your bank or payment provider without first attempting resolution through Shubhastro's customer support is a violation of our Terms. Shubhastro reserves the right to suspend or permanently ban accounts associated with fraudulent chargebacks and to pursue recovery of amounts through legal channels.</p>

      <h4 className={styles.subtitle}>8. CONSUMER PROTECTION COMPLIANCE</h4>
      <p className={styles.paragraph}>This Policy is designed in accordance with the Consumer Protection Act, 2019 and Consumer Protection (E-Commerce) Rules, 2020 of India. Users retain all rights under applicable consumer protection legislation.</p>
      <p className={styles.paragraph}>Users may escalate unresolved complaints to:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Consumer Helpline: 1800-11-4000 or 14404 (National Consumer Helpline)</li>
        <li className={styles.listItem}>Consumer Forum: Under the Consumer Protection Act, 2019</li>
        <li className={styles.listItem}>SEBI Scores / RBI Ombudsman: For payment/financial disputes as applicable</li>
      </ul>

      <h4 className={styles.subtitle}>9. CONTACT FOR REFUND QUERIES</h4>
      <p className={styles.paragraph}><strong>Shubhastro Customer Support</strong></p>
      <ul className={styles.list}>
        <li className={styles.listItem}>Email: <a href="mailto:connect@pittiegroup.com" className={styles.link}>connect@pittiegroup.com</a></li>
        <li className={styles.listItem}>Grievance Officer Email: <a href="mailto:grievance@shubhastro.com" className={styles.link}>grievance@shubhastro.com</a></li>
        <li className={styles.listItem}>Address: [Registered Office Address, City, State, PIN, India]</li>
        <li className={styles.listItem}>Support Hours: Monday to Saturday, 9:00 AM to 6:00 PM IST</li>
        <li className={styles.listItem}>Response Time: We aim to acknowledge all refund queries within 48 hours</li>
      </ul>

      <p className={styles.paragraph} style={{ marginTop: '2rem' }}>Shubhastro is committed to fair and transparent dealings. Your trust is our priority.</p>
    </div>
  );
};

export default RefundPolicy;
