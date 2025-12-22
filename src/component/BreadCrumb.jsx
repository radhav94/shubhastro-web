import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import styles from "./Breadcrumb.module.scss";

const Breadcrumb = () => {
  const location = useLocation();
  const params = useParams();

  const isAstroDashboard = location.pathname.startsWith(
    "/astrologer-dashboard"
  );

  const pathnames = location.pathname
    .split("/")
    .filter(Boolean);

  if (!pathnames.length) return null;

  const astrologerName =
    location.state?.fullName ||
    location.state?.astroName;

  return (
    <div className={styles.breadCrumb}>
      {isAstroDashboard ? (
        <Link to="/astrologer-dashboard">Astrologer Dashboard</Link>
      ) : (
        <Link to="/">Home</Link>
      )}

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        if (isAstroDashboard && index === 0) return null;

        let label = name.replace(/-/g, " ");

        // 🔥 Replace astrologer ID with name
        if (
          pathnames[index - 1] === "talk-to-astrologers" &&
          name === params.id &&
          astrologerName
        ) {
          label = astrologerName;
        }

        return (
          <span key={routeTo}>
            {" > "}
            {isLast ? (
              <span className="text-yellow-500 capitalize">{label}</span>
            ) : (
              <Link to={routeTo} className="capitalize">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default Breadcrumb;
