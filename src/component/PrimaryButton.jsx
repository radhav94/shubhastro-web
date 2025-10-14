import React from "react";
import { IconContext } from "react-icons";
import { appColors } from "../utils/theme";
import PrimaryText from "./PrimaryText";

const PrimaryButton = ({
  title = "",
  onClick,
  type = "button", // default type
  fontSize,
  className = "",
  buttonStyles = {},
  textColor = appColors.black,
  transparent = false,
  isLoading = false,
  IconComponent,
  imgSrc,
  borderColor,
  imgAlt = "button-img",
  imgSize = 12,
  bgColor,
  width,
  ...rest
}) => {
  const baseButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    padding: "8px 16px",
    flexDirection: "row",
    cursor: isLoading ? "not-allowed" : "pointer",
    border: `1.4px solid ${
      borderColor || (transparent ? textColor : "transparent")
    }`,
    backgroundColor: transparent ? "transparent" : bgColor || appColors.pri,
    color: textColor,
    position: "relative",
    userSelect: "none",
    gap: 6,
    width: width,
    ...buttonStyles,
  };

  return (
    <button
      type={type}
      style={baseButtonStyle}
      className={className}
      onClick={isLoading ? undefined : onClick}
      disabled={isLoading}
      {...rest}
    >
      {isLoading ? (
        <PrimaryText color={textColor}>Loading...</PrimaryText>
      ) : (
        <>
          {IconComponent && (
            <IconContext.Provider value={{ color: textColor, size: "1.1em" }}>
              <IconComponent />
            </IconContext.Provider>
          )}

          {imgSrc && (
            <img
              src={imgSrc}
              alt={imgAlt}
              style={{
                width: imgSize,
                height: imgSize,
                objectFit: "contain",
                color: appColors.pri,
              }}
            />
          )}

          {title && (
            <PrimaryText
              isSemiBold
              color={textColor}
              style={{ lineHeight: "1.2em", fontSize }}
            >
              {title}
            </PrimaryText>
          )}
        </>
      )}
    </button>
  );
};

export default PrimaryButton;
