import { Field, ErrorMessage } from "formik";
import styles from "./Input.module.scss";

import { combineClasses } from "../../../utils/utlis";
import ErrorText from "../../ErrorText";

const Input = (props) => {
  const { label, name, icon, placeholder, isRequired, type, ...rest } = props;

  const dontAllowSpacesIfEmpty = (e) => {
    if (e.key === " " && e.target.value.length === 0) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.inputControl}>
      {label && (
        <label className={styles.label} htmlFor={name}>
          {label}{" "}
          {isRequired ? <span className={styles.requiredMark}>*</span> : ""}
        </label>
      )}

      <Field name={name}>
        {({ field }) => {
          return (
            <input
              {...field}
              {...rest}
              id={name}
              type={type || "text"}
              className={combineClasses(styles.inputField, props.className)}
              placeholder={placeholder}
              onKeyDown={(e) => {
                dontAllowSpacesIfEmpty(e);
                props?.onKeyDown?.(e);
              }}
            />
          );
        }}
      </Field>
      <ErrorMessage name={name} component={ErrorText} />
    </div>
  );
};

export default Input;
