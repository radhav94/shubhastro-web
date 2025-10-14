import React, { useState } from "react";
import { Field, ErrorMessage } from "formik";
import styles from "./Password.module.scss";
import ErrorText from "components/shared/errortext/ErrorText";
import { ReactComponent as Eye } from "assets/svg/eye.svg";
import { ReactComponent as EyeSlash } from "assets/svg/eye-slash.svg";
import { useDispatch, useSelector } from "react-redux";
import { setPasswordFormatModalOpen } from "redux/slices/globalSlice";
import ViewPasswordFormat from "../input/ViewPasswordFormat";
// import TextError from '../shared/TextError'
// import { TextField } from '@mui/material'

const Password = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  const { passwordFormatModalOpen } = useSelector((state) => state.global);

  const dispatch = useDispatch();

  const {
    label,
    name,
    icon,
    placeholder,
    isRequired,
    showPasswordFormat = false,
    ...rest
  } = props;

  const togglePasswordFormat = (e) => {
    dispatch(setPasswordFormatModalOpen(!passwordFormatModalOpen));
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };
  return (
    <div className={styles.inputControl} onClick={(e) => e.stopPropagation()}>
      <label className={styles.label} htmlFor={name}>
        {label}{" "}
        {isRequired ? <span className={styles.requiredMark}>*</span> : ""}
        {showPasswordFormat && (
          <span
            className={styles.viewPasswordFormat}
            onClick={togglePasswordFormat}
          >
            View password format
            {passwordFormatModalOpen && <ViewPasswordFormat />}
          </span>
        )}
      </label>
      <Field name={name} {...rest}>
        {({ field }) => {
          return (
            <>
              <input
                {...field}
                id={name}
                className={styles.inputField}
                placeholder={placeholder}
                type={showPassword ? "text" : "password"}
              />
              {showPassword ? (
                <Eye onClick={toggleShowPassword} className={styles.eyeIcon} />
              ) : (
                <EyeSlash
                  onClick={toggleShowPassword}
                  className={styles.eyeIcon}
                />
              )}
            </>
          );
        }}
      </Field>
      <ErrorMessage name={name} component={ErrorText} />
    </div>
  );
};

export default Password;
