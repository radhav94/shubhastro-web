import React from "react";
import { PrimaryText, WorkInProgressCard } from "../../../component";
import PrimaryTabs from "../../../component/UI/tabs/PrimaryTabs";
import styles from "./SessionDetails.module.scss";

const NoDataAnimation = ({
  title = "No Data Available",
  message = "It looks like there's nothing to show here right now.",
}) => {
  return (
    <div className={styles.noDataContainer}>
      <div className={styles.animationWrapper}>
        {/* These spans will be styled as pulsing stars */}
        <span className={`${styles.star} ${styles.star1}`}></span>
        <span className={`${styles.star} ${styles.star2}`}></span>
        <span className={`${styles.star} ${styles.star3}`}></span>
        <span className={`${styles.star} ${styles.star4}`}></span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
    </div>
  );
};

const SessionDetails = () => {
  const tabsData = [
    {
      label: "Astrologer Requests",
      content: (
        <NoDataAnimation
          title="No New Requests"
          message="There are currently no new session requests from users."
        />
      ),
    },
    {
      label: "My Sessions",
      content: (
        <NoDataAnimation
          title="No Sessions Found"
          message="You haven't had any sessions yet. Check back after a user session is complete."
        />
      ),
    },
  ];

  return (
    <>
      <PrimaryTabs tabs={tabsData} />
    </>
  );
};

export default SessionDetails;
