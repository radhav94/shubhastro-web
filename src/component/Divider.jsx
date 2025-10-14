import React from "react";

const Divider = ({
  color = "#ddd",
  thickness = 1,
  margin = "4px 0",
  responsive = false,
}) => {
  const dividerStyle = {
    border: "none",
    borderTop: `${thickness}px solid ${color}`,
    margin: margin,
    width: responsive ? "100%" : "100vw",
    boxSizing: "border-box",

    ...(responsive
      ? {}
      : {
          position: "relative",
          left: "50%",
          transform: "translateX(-50%)",
        }),
  };

  return <hr style={dividerStyle} />;
};

export default Divider;
