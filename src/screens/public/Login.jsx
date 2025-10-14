import React from "react";
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { combineClasses, requiredMessage } from "../../utils/utlis";
import { emailRegex } from "../../utils/regex";
import styles from "./Login.module.scss";
import FormikControl from "../../component/formikcontrols/FormikControl";
import { PrimaryButton } from "../../component";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../utils/routes/Paths";

const Login = () => {
  const navigate = useNavigate();

  const initialValues = {
    email: "",
    password: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .required(requiredMessage("Email ID"))
      .matches(emailRegex, "Invalid email format!"),
    password: Yup.string().required(requiredMessage("Password")),
  });

  const handleSubmit = () => {};
  return (
    <>
      {/* <SelectRoleModal {...modalProps} /> */}
      <LoginLayout>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {(formik) => {
            return (
              <div className={styles.mainDiv}>
                <p className={styles.heading}>Welcome back,</p>
                <p className={styles.subHeading}>Let's sign in your account</p>
                <Form className={styles.form} autoComplete="off">
                  <FormikControl
                    name="email"
                    control="input"
                    label="Email ID"
                    placeholder="Enter Email ID"
                    isRequired={true}
                    formik={formik}
                  />
                  <FormikControl
                    name="password"
                    control="input"
                    type="password"
                    label="Password"
                    placeholder="Enter Password"
                    isRequired={true}
                  />

                  <PrimaryButton
                    title="Login"
                    buttonStyles={{ marginTop: "12px" }}
                    onClick={() => navigate(PATH.privateRoutes.HOME.path)}
                  />

                  <p
                    className={combineClasses(styles.bottomText, "link-text")}
                    onClick={() =>
                      navigate(PATH.publicRoutes.FORGOT_PASSWORD.path)
                    }
                  >
                    Forgot Password?
                  </p>
                </Form>
              </div>
            );
          }}
        </Formik>
      </LoginLayout>
    </>
  );
};

export default Login;
