import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Breadcrumb.module.scss";

const Breadcrumb = () => {
  const location = useLocation();

  const isAstroDashboard = location.pathname.startsWith("/astrologer-dashboard");

  const pathnames = location.pathname
    .split("/")
    .filter((x) => x.replace(/\d+/g, ""));

  if (pathnames.length === 0) return null;

  return (
    <div className={styles.breadCrumb}>
      {/* If inside Astrologer Dashboard, start from "Astrologer Dashboard" */}
      {isAstroDashboard ? (
        <Link to="/astrologer-dashboard">Astrologer Dashboard</Link>
      ) : (
        <Link to="/">Home</Link>
      )}

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        // Skip the first segment when in astrologer-dashboard (to avoid duplication)
        if (isAstroDashboard && index === 0) return null;

        return (
          <span key={routeTo}>
            {" > "}
            {isLast ? (
              <span className="text-yellow-500">{name.replace(/-/g, " ")}</span>
            ) : (
              <Link to={routeTo}>{name.replace(/-/g, " ")}</Link>
            )}
          </span>
        );
      })}
    </div>
  );
};


export default Breadcrumb;
