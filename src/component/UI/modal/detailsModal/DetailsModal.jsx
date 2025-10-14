import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import styles from "./DetailsModal.module.scss";
import PrimaryButton from "../../../PrimaryButton";
import PrimaryText from "../../../PrimaryText";
import { IoMdClose } from "react-icons/io";
import { Form, Formik } from "formik";
import FormikControl from "../../../formikcontrols/FormikControl";
import * as Yup from "yup";
import { requiredMessage } from "../../../../utils/utlis";
import { getWidth } from "../../../../utils/theme";
import toast from "../../../toast";

const DetailsModal = ({ isOpen, onClose, handleSubmit }) => {
  const [initialValues, setInitialValues] = useState({
    firstName: "",
    lastName: "",
    age: "",
    preLoad: false,
  });

  const validationSchema = Yup.object({
    firstName: Yup.string().required(requiredMessage("First Name")),
    lastName: Yup.string().required(requiredMessage("Last Name")),
    age: Yup.number()
      .typeError("Age must be a number")
      .required(requiredMessage("Age"))
      .positive("Age must be positive")
      .integer("Age must be an integer"),
  });

  const modalWidth = `${getWidth() * 0.44}px`;

  const onSubmit = (val) => {
    handleSubmit(val);
  };

  useEffect(() => {
    const storedData = localStorage.getItem("userDetails");
    if (storedData) {
      setInitialValues({
        ...JSON.parse(storedData),
        preLoad: true,
      });
    }
  }, []);

  return (
    <Modal modalOpen={isOpen} width={modalWidth}>
      <div className=" p-4">
        <div className="flex justify-between">
          <PrimaryText size_20 isExtraBold>
            Share Your Details
          </PrimaryText>
          <IoMdClose
            size={22}
            onClick={() => onClose(false)}
            className="cursor-pointer"
          />
        </div>
        <div>
          <PrimaryText>
            Please share your birth details with the astrologer to ensure faster
            and accurate consultation.
          </PrimaryText>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <div className={styles.mainDiv}>
              <Form className={styles.form} autoComplete="off">
                <FormikControl
                  name="firstName"
                  control="input"
                  placeholder="First Name *"
                  formik={formik}
                  label="first name"
                />
                <FormikControl
                  name="lastName"
                  control="input"
                  placeholder="Last Name *"
                  formik={formik}
                  label="last name"
                />
                <FormikControl
                  name="age"
                  control="input"
                  placeholder="Age *"
                  formik={formik}
                  label="age name"
                />

                <div className={styles.buttonContainer}>
                  <PrimaryButton
                    type="submit"
                    width="90%"
                    title={initialValues.preLoad ? "Proceed" : "Submit"}
                    disabled={formik.isSubmitting}
                    onClick={formik.submitForm}
                  />
                </div>
              </Form>
            </div>
          )}
        </Formik>
      </div>
    </Modal>
  );
};

export default DetailsModal;
