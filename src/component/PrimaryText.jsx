import React from "react";

const PrimaryText = ({
  children,
  style = {},
  className = "",
  color,
  isWhite,
  isDanger,
  isLight,
  isRegular,
  isSemiBold,
  isBold,
  isExtraBold,
  size_10,
  size_12,
  size_14,
  size_16,
  size_18,
  size_20,
  size_24,
  size_28,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  isCenter,
  isRight,
  onClick,
  as = "p",
  lines, // NEW: number of lines before truncating
  ...rest
}) => {
  const textAlign = isCenter ? "center" : isRight ? "right" : "left";

  const textColor = color
    ? color
    : isWhite
    ? "#fff"
    : isDanger
    ? "#FF4D4F"
    : "#000";

  const fontWeight = isRegular
    ? "400"
    : isSemiBold
    ? "600"
    : isBold
    ? "700"
    : isExtraBold
    ? "800"
    : "400";

  const fontSize = size_10
    ? "10px"
    : size_12
    ? "12px"
    : size_14
    ? "14px"
    : size_16
    ? "16px"
    : size_18
    ? "18px"
    : size_20
    ? "20px"
    : size_24
    ? "24px"
    : size_28
    ? "28px"
    : "16px";

  const Component = as;

  return (
    <Component
      onClick={onClick}
      className={className}
      style={{
        color: textColor,
        fontWeight,
        fontSize,
        textAlign,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        margin: 0,
        display: lines ? "-webkit-box" : "block", // multi-line clamp
        WebkitLineClamp: lines || "none",
        WebkitBoxOrient: lines ? "vertical" : "unset",
        overflow: lines ? "hidden" : "visible",
        textOverflow: lines ? "ellipsis" : "unset",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default PrimaryText;
