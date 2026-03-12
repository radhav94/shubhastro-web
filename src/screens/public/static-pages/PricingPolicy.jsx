import React from "react";
import styles from "./StaticPages.module.scss";
import Divider from "../../../component/Divider";

const PricingPolicy = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PRICING POLICY</h1>
      <Divider />

      <h4 className={styles.subtitle}>Price Range</h4>
      <p className={styles.paragraph}>
        At ShubhAstro.com we have customised pricing according to the services
        rendered by us. The details are provided to you beforehand according to
        the effort, efficiency and the output of the service. Typically, the
        range of transactions on our Android and iOS applications varies from
        INR 500 to 1500 per user per session.
      </p>

      <h4 className={styles.subtitle}>Schedule of payment</h4>
      <p className={styles.paragraph}>
        Some of our services can be utilised for fixed durations. In such cases,
        it is clearly mentioned within the description of these services. The
        period of usage in these cases vary from 1 month to 6 months.
      </p>

      <h4 className={styles.subtitle}>Price Matching</h4>
      <p className={styles.paragraph}>
        At ShubhAstro.com we are committed to offering you the best possible
        prices. We will be glad to meet our competitor's pricing if you ever
        find a service that we offer, in the similar interest and providing same
        professionalism and features, available from a similar service provider.
      </p>
      <p className={styles.paragraph}>
        Our prices do not vary according to the market needs, competitor pricing
        etc.
      </p>

      <h4 className={styles.subtitle}>Sale Adjustment</h4>
      <p className={styles.paragraph}>
        If a service that you have purchased is reduced in price within one
        weeks of your booking date, we will not be able to adjust the sale price
        for you. Please note that we cannot make sale adjustment. If you have
        booked a slot for a date, generally, we cannot reschedule the slot to
        another date. This will result in the cancellation of the
        booking/order(s). Please refer cancellation policies for more details.
      </p>

      <h4 className={styles.subtitle}>Pricing Errors</h4>
      <p className={styles.paragraph}>
        We work hard to ensure the accuracy of pricing. Despite our efforts,
        pricing errors may still occur. If a service's price is higher than the
        price displayed, we will cancel your booking and notify you of the
        cancellation.
      </p>
      <p className={styles.paragraph}>
        Our service is offered for sale by ShubhAstro Services Private Limited
        (Formerly Codeyeti Software Solutions Pvt. Ltd.) for your personal
        needs. Therefore, we reserve the right to refuse to sell to any person
        whom we believe may be misusing the service.
      </p>
      <p className={styles.paragraph}>
        Please feel free to reach us at{" "}
        <a href="mailto:support@ShubhAstro.in" className={styles.link}>
          support@shubhastro.in
        </a>
      </p>
    </div>
  );
};

export default PricingPolicy;
