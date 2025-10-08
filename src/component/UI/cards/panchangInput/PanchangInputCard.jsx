import React from "react";
import styles from "./PanchangInputCard.module.scss";
import FormikControl from "../../../formikcontrols/FormikControl";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { requiredMessage } from "../../../../utils/utlis";

import PrimaryButton from "../../../PrimaryButton";
import PrimaryText from "../../../PrimaryText";

const PanchangInputCard = ({
  imageSrc,
  title,

  onSubmit,
}) => {
  const initialValues = {
    dateOfBirth: "",
    location: "",
  };

  const validationSchema = Yup.object({
    dateOfBirth: Yup.string().required(requiredMessage("Date of Birth")),
    location: Yup.string().required(requiredMessage("Location")),
  });

  const handleSubmit = (values) => {
    if (onSubmit) onSubmit(values);
  };

  return (
    <div className={styles.panchangWidget}>
      <div className={styles.leftSide}>
        <img src={imageSrc} alt="Panchang Widget" />
      </div>

      <div className={styles.rightSide}>
        {title && (
          <PrimaryText isExtraBold size_20>
            {title}
          </PrimaryText>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <div className={styles.mainDiv}>
              <Form className={styles.form}>
                <div className={styles.inputBox}>
                  <FormikControl
                    name="dateOfBirth"
                    control="date"
                    type="date"
                    label="Date of Birth"
                    placeholder="Enter Date of Birth"
                    isRequired={true}
                    formik={formik}
                    maxDate={new Date().toISOString().split("T")[0]}
                  />
                  <FormikControl
                    name="location"
                    control="input"
                    label="Location"
                    placeholder="Enter Location"
                    isRequired={true}
                    formik={formik}
                  />
                </div>

                <PrimaryButton
                  width={"80%"}
                  title="Submit"
                  buttonStyles={{ marginTop: "12px" }}
                  onClick={formik.handleSubmit}
                />
              </Form>
            </div>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default PanchangInputCard;
