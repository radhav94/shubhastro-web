import React from "react";
import PrimaryText from "./PrimaryText";
import Divider from "./Divider";
import PrimaryButton from "./PrimaryButton";

const Title = ({
  title = "",
  showDivider = false,
  showButton = false,
  buttonTitle = "View",
  buttonWidth = "100px",
}) => {
  const headerStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "12px",
    flexWrap: "nowrap",
    marginVertical: "12px",
  };

  const headerTitleStyle = {
    flex: "1 1 auto",
    whiteSpace: "nowrap",
    margin: 0,
    fontSize: "24px",
  };

  const smallScreen = window.innerWidth <= 768;
  const extraSmallScreen = window.innerWidth <= 480;

  if (smallScreen) {
    headerStyle.flexDirection = "column";
    headerStyle.alignItems = "flex-start";
    headerStyle.gap = "8px";
    headerStyle.marginBottom = "12px";
    headerTitleStyle.fontSize = "20px";
  }

  if (extraSmallScreen) {
    headerTitleStyle.fontSize = "18px";
  }

  return (
    <div style={headerStyle}>
      <PrimaryText isBold style={headerTitleStyle}>
        {title}
      </PrimaryText>

      {showDivider && <Divider responsive />}
      {showButton && <PrimaryButton width={buttonWidth} title={buttonTitle} />}
    </div>
  );
};

export default Title;
