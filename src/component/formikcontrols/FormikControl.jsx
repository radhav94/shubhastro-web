import React, { memo } from "react";
import Input from "./input/Input";

const FormikControl = (props) => {
  const { control, ...rest } = props;

  switch (control) {
    case "input":
      return <Input {...rest} />;

    default:
      return null;
  }
};

export default memo(FormikControl);
