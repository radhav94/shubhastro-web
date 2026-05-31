import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./PolicyView.module.scss";

const AppLicense = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.headerWrap}>
        <header className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>App License</h1>
        </header>
      </div>

      <div className={styles.content}>
        <div className={styles.updateInfo}>
          <p className={styles.updateText}>Last Updated: 20 January 2024, 10:00 AM</p>
        </div>

        <div className={styles.section}>
          <p className={styles.paragraph}>
            This App License Agreement ("Agreement") is between you and ShubhAstro Services
            Private Limited ("ShubhAstro", "we", "us", or "our") regarding your use of the
            ShubhAstro mobile application and related services.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. License Grant</h2>
          <p className={styles.paragraph}>
            Subject to your compliance with this Agreement, ShubhAstro grants you a limited,
            non-exclusive, non-transferable, revocable license to download, install, and use the
            ShubhAstro application on your personal mobile device solely for your personal,
            non-commercial use.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. License Restrictions</h2>
          <p className={styles.paragraph}>You agree not to:</p>
          <ul className={styles.list}>
            <li>Copy, modify, or create derivative works of the application</li>
            <li>Reverse engineer, decompile, or disassemble the application</li>
            <li>Remove, alter, or obscure any proprietary notices</li>
            <li>Use the application for any commercial purpose without authorization</li>
            <li>Distribute, sublicense, rent, lease, or lend the application</li>
            <li>Use the application in any way that violates applicable laws</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Intellectual Property Rights</h2>
          <p className={styles.paragraph}>
            The application and all rights, including intellectual property rights, are and shall
            remain the property of ShubhAstro and its licensors. This Agreement does not grant
            you any rights to trademarks, service marks, or logos of ShubhAstro.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Updates and Modifications</h2>
          <p className={styles.paragraph}>
            ShubhAstro may provide updates, patches, or modifications to the application. These
            updates may be automatically downloaded and installed. You agree that ShubhAstro has
            no obligation to provide any updates or continue to provide particular features.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Data Collection and Privacy</h2>
          <p className={styles.paragraph}>
            Your use of the application is subject to our Privacy Policy. By using the
            application, you consent to the collection, use, and sharing of your information as
            described in the Privacy Policy.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Third-Party Services</h2>
          <p className={styles.paragraph}>
            The application may contain links to third-party services or integrate with
            third-party platforms. ShubhAstro is not responsible for the content, privacy
            policies, or practices of any third-party services.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Termination</h2>
          <p className={styles.paragraph}>
            This license is effective until terminated. Your rights under this license will
            terminate automatically without notice if you fail to comply with any term of this
            Agreement. Upon termination, you must cease all use of the application and delete all
            copies from your devices.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Disclaimer of Warranties</h2>
          <p className={styles.paragraph}>
            THE APPLICATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. SHUBHASTRO
            DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES
            OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Limitation of Liability</h2>
          <p className={styles.paragraph}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHUBHASTRO SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR
            RELATED TO YOUR USE OF THE APPLICATION.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Governing Law</h2>
          <p className={styles.paragraph}>
            This Agreement shall be governed by and construed in accordance with the laws of
            India, without regard to its conflict of law provisions.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Contact Information</h2>
          <p className={styles.paragraph}>
            For questions about this App License, please contact us at{" "}
            <a href="mailto:support@shubhastro.com" className={styles.link}>
              support@shubhastro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppLicense;
