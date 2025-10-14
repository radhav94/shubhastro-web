import React from "react";
import PrimaryText from "./PrimaryText";

const ErrorText = ({ children }) => {
  return (
    <PrimaryText size_14 className="validation-error-text">
      {children}
    </PrimaryText>
  );
};

export default ErrorText;
