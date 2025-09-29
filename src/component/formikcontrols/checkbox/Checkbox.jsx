import React from "react";
import { Field, ErrorMessage } from "formik";
import styles from "./Checkbox.module.scss";
import ErrorText from "../../ErrorText";

// import TextError from '../shared/TextError'
// import { TextField } from '@mui/material'

const Checkbox = (props) => {
  const { label, name, icon, placeholder, isRequired, type, ...rest } = props;

  return (
    <div className={styles.inputControl}>
      <div className={styles.checkboxDiv}>
        <Field name={name}>
          {({ field }) => {
            return (
              <input
                {...field}
                {...rest}
                id={name}
                checked={field.value}
                type={"checkbox"}
                className={styles.inputField}
                placeholder={placeholder}
              />
            );
          }}
        </Field>
        <label className={styles.label} htmlFor={name}>
          {label}{" "}
          {isRequired ? <span className={styles.requiredMark}>*</span> : ""}
        </label>
      </div>
      <ErrorMessage name={name} component={ErrorText} />
    </div>
  );
};

export default Checkbox;
