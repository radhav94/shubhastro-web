import PrimaryText from "../../../../component/PrimaryText";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import { useState } from "react";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";
import DateWithSingleInputForm from "../forms/DateWithSingleInputForm";

const STORAGE_KEY = "vehicle_calculator";

const initialFormState = {
  dob: "",
  vehicle: "",
};

const VehicleCalc = () => {
  const navigate = useNavigate();
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
    } else if (
      !/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/.test(vehicle.toUpperCase())
    ) {
      errors.vehicle = "Please enter a valid vehicle number (e.g. MH12AB1234)";
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    navigate("/lucky-vehicle-number-calculator/report");
  };

  return (
    <div style={{ margin: "0 3rem" }}>
      <PrimaryText isCenter isSemiBold size_24>
        Lucky Vehicle Number Calculator: Your Guide to Choosing the Perfect
        Number
      </PrimaryText>

      <PrimaryText style={{ color: "gray", marginTop: "0.5rem" }} size_16>
        Thinking of buying a new car or bike and hoping it brings more than just
        convenience, maybe a bit of good luck too? You’re not alone. In India,
        many people believe that the number on your vehicle isn’t just random,
        it can shape the kind of energy you invite into your daily life. That’s
        where a <strong>Lucky Vehicle Number Calculator</strong> comes in. Based
        on your date of birth and key numerology principles, it helps you choose
        a number that aligns with your personal energy, attracting prosperity,
        safety, and positive vibes on the road.
      </PrimaryText>

      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>

      <DateWithSingleInputForm
        title="Calculate your Lucky Vehicle Number here"
        submitText="Calculate my Lucky Vehicle Number"
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
          localStorage.removeItem(STORAGE_KEY);
        }}
      />
    </div>
  );
};

export default VehicleCalc;
