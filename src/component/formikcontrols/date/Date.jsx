import React from "react";
import { Field, ErrorMessage } from "formik";
import styles from "./Date.module.scss";
import ErrorText from "../../ErrorText";

const Date = (props) => {
  const { label, name, icon, placeholder, isRequired, type, ...rest } = props;

  return (
    <div className={styles.inputControl}>
      <label className={styles.label} htmlFor={name}>
        {label}{" "}
        {isRequired ? <span className={styles.requiredMark}>*</span> : ""}
      </label>
      <Field name={name}>
        {({ field, form }) => {
          return (
            <input
              {...field}
              {...rest}
              id={name}
              type={"date"}
              className={styles.inputField}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  form.handleSubmit();
                }
              }}
            />
          );
        }}
      </Field>
      <ErrorMessage name={name} component={ErrorText} />
    </div>
  );
};

export default Date;
