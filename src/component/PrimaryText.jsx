import React from "react";

const PrimaryText = ({
  children,
  style = {},
  className = "",
  color,
  isWhite,
  isDanger,
  // All fontWeight props
  isRegular,
  isSemiBold,
  isBold,
  isExtraBold,
  isItalic,
  // All size props
  size_10,
  size_12,
  size_14,
  size_16,
  size_18,
  size_20,
  size_24,
  size_28,
  size_32,
  // All padding props
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  // All alignment props
  isCenter,
  isRight,
  onClick,
  as = "div",
  lines,
  dangerouslySetInnerHTML,
  ...rest
}) => {
  // Logic combines props for full compatibility
  const textAlign = isCenter
    ? "center"
    : isRight
    ? "right"
    : style.textAlign || "left";

  const fontStyle = isItalic ? "italic" : style.fontStyle || "normal";

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
    : "400"; // Default to regular

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
    : size_32
    ? "32px"
    : "16px"; // Default to 16px

  const Component = as;

  // Combine all styles
  const finalStyle = {
    color: textColor,
    fontWeight,
    fontSize,
    textAlign,
    fontStyle,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    ...style, // Allow style prop to override anything
  };

  if (lines) {
    Object.assign(finalStyle, {
      display: "-webkit-box",
      WebkitLineClamp: lines,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      textOverflow: "ellipsis",
    });
  }

  return dangerouslySetInnerHTML ? (
    <Component
      onClick={onClick}
      className={className}
      style={finalStyle}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
      {...rest}
    />
  ) : (
    <Component
      onClick={onClick}
      className={className}
      style={finalStyle}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default PrimaryText;
