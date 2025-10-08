import React, { memo } from "react";
import Input from "./input/Input";
import Date from "./date/Date";

const FormikControl = (props) => {
  const { control, ...rest } = props;

  switch (control) {
    case "input":
      return <Input {...rest} />;
    // case "password":
    //   return <Password {...rest} />;

    case "date":
      return <Date {...rest} />;

    default:
      return null;
  }
};

export default memo(FormikControl);
