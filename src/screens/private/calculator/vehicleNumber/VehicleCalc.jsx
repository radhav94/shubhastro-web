import { useState } from "react";
import { useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";
import DateWithSingleInputForm from "../forms/DateWithSingleInputForm";
import styles from "./VehicleCalc.module.scss";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "vehicle_calculator";

const initialFormState = {
  dob: "",
  vehicle: "",
};

const VehicleCalc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "vehicle" ? value.toUpperCase() : value,
    }));
  };

  const validateVehicleInput = ({ dob, vehicle }) => {
    const errors = {};

    if (!dob) {
      errors.dob = "Date of birth is required";
    }

    if (!vehicle) {
      errors.vehicle = "Vehicle number is required";
    } else {
      const upperVehicle = vehicle.toUpperCase();
      // Standard format: MH12AB1234
      const standardPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/;
      // Bharat series format: 22BH1234AA
      const bharatPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

      if (!standardPattern.test(upperVehicle) && !bharatPattern.test(upperVehicle)) {
        errors.vehicle = "Please enter a valid vehicle number (e.g. MH12AB1234 or 22BH1234AA)";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      dob: formData.dob,
      vehicle: formData.vehicle,
    };

    const validationErrors = validateVehicleInput(payload);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    dispatch(setCalculatorData({ key: STORAGE_KEY, data: payload }));
    navigate("/lucky-vehicle-number-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Lucky Vehicle Number Calculator</h1>
        <p>Your Guide to Choosing the Perfect Number</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Lucky Vehicle Number?</h3>
        <p>
          Thinking of buying a new car or bike and hoping it brings more than just
          convenience, maybe a bit of good luck too? Based on your date of birth
          and key numerology principles, it helps you choose a number that aligns
          with your personal energy, attracting prosperity, safety, and positive
          vibes on the road.
        </p>
      </div>

      <DateWithSingleInputForm
        title="Calculate your Lucky Vehicle Number here"
        submitText="Show Results"
        inputLabel="Vehicle Number"
        inputPlaceholder="ENTER FULL VEHICLE NUMBER E.G. MH12AB1234"
        inputName="vehicle"
        inputType="text"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={() => {
          setFormData(initialFormState);
          setErrors({});
          dispatch(setCalculatorData({ key: STORAGE_KEY, data: null }));
        }}
      />
    </div>
    </>
  );
};

export default VehicleCalc;
