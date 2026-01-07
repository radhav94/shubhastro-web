import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import styles from "./Breadcrumb.module.scss";
import { useSelector } from "react-redux";
import { blogApi } from "../services/appServices/blogService";
import { epoojaApi } from "../redux/api/astromall/epooja/epoojaApi";

const Breadcrumb = () => {
  const location = useLocation();
  const params = useParams();
  const { slug, productSlug } = params;

  const isAstroDashboard = location.pathname.startsWith(
    "/astrologer-dashboard"
  );

  const pathnames = location.pathname.split("/").filter(Boolean);

  const astrologerName = location.state?.fullName || location.state?.astroName;

  /* Blog and Darshan selectors (hooks must ALWAYS run) */
  const blogSelector = blogApi.endpoints.getSingleBlog.select(slug);
  const darshanSelector =
    epoojaApi.endpoints.getSingleEPooja.select(productSlug);

  const blogData = useSelector(blogSelector);
  const darshanData = useSelector(darshanSelector);

  const blogTitle = pathnames.includes("blog")
    ? blogData?.data?.data?.title
    : null;

  const darshanTitle =
    slug === "live-darshan" ? darshanData?.data?.data?.title : null;

  /* Safe early return AFTER hooks */
  if (!pathnames.length) return null;

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

        // Skip "horoscopes" and "tarot" from breadcrumb display
        if (
          name.toLowerCase() === "horoscopes" ||
          name.toLowerCase() === "tarot"
        ) {
          return null;
        }

        let label = name.replace(/-/g, " ");

        if (
          pathnames[index - 1] === "talk-to-astrologers" &&
          name === params.id &&
          astrologerName
        ) {
          label = astrologerName;
        }

        if (pathnames[index - 1] === "blog" && blogTitle) {
          label = blogTitle;
        }

        if (
          pathnames[index - 1] === "live-darshan" &&
          name === productSlug &&
          darshanTitle
        ) {
          label = darshanTitle;
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
