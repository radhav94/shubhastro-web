import React from "react";
import { Link, useLocation } from "react-router-dom";

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname
    .split("/")
    .filter((x) => x.replace(/\d+/g, "")); // Remove numeric segments
  if (pathnames.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "4px",
        padding: "4px",
      }}
    >
      <Link to="/">Home</Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

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
