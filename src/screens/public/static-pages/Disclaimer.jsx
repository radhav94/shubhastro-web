import React from "react";
import styles from "./StaticPages.module.scss";
import Divider from "../../../component/Divider";

const Disclaimer = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>OUR DISCLAIMER</h1>
      <Divider />

      <p className={styles.paragraph}>
        The information and data contained on ShubhAstro website is to be
        treated purely for your entertainment purposes only. Any prediction or
        other message that you receive is not a substitute for advice,
        programs, or treatment that you would normally receive from a licensed
        professional such as a lawyer, doctor, psychiatrist, or financial
        advisor. Accordingly,
      </p>
      
      <p className={styles.paragraph}>
        ShubhAstro.com provides no guarantees, implied warranties, or assurances of any kind, and will not be responsible for any interpretation made or use by the recipient of the
        information and data mentioned above.
      </p>

      <p className={styles.paragraph}>
        Moreover, ShubhAstro.com is not a registered firm. It is a product of ShubhAstro Services Private Limited. All the transaction and
        gathered data is / will be accessed by ShubhAstro.
      </p>
    </div>
  );
};

export default Disclaimer;