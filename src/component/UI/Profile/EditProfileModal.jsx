import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import styles from "./AddProfileModal.module.scss";
import { Toast } from "../../index";
import { relationOption } from "../../../utils/constanats/appData";
import DateTimePicker from "../dateTimePicker/DateTimePicker";

const EditProfileModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title = "Edit Profile",
  initialData = null,
  savedKundlis = [],
}) => {
  const [formData, setFormData] = useState({
    name: "",
    identity: "Male",
    relation: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    unknownBirthTime: false,
    latitude: null,
    longitude: null,
    timezone: 5.5,
  });

  // Track whether the user has started editing (to prevent reinitialize from overwriting)
  const [isEditing, setIsEditing] = useState(false);
  // Track whether the DateTimePicker has an invalid date input
  const [dateInputError, setDateInputError] = useState("");

  // Check if a "Self" profile exists (excluding the current profile being edited)
  const hasSelfProfile = savedKundlis.some(
    (profile) => 
      profile.relation?.toLowerCase() === "self" && 
      profile.name !== initialData?.name
  );

  const isCurrentProfileSelf = formData.relation?.toLowerCase() === "self";

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Name is required")
      .matches(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),
    relation: Yup.string()
      .required("Relation is required")
      .test(
        "unique-self",
        "A Self profile already exists. Please select a different relation.",
        function(value) {
          // Allow "Self" if the current profile being edited is already "Self"
          const isCurrentlySelf = initialData?.relation?.toLowerCase() === "self";
          
          // Allow any relation except "Self" if a Self profile already exists
          // and the current profile is not already "Self"
          if (value?.toLowerCase() === "self" && hasSelfProfile && !isCurrentlySelf) {
            return false;
          }
          return true;
        }
      )
      .test(
        "last-self",
        "Cannot change the last Self profile. At least one Self profile is required.",
        function(value) {
          // Check if this is the last "Self" profile being changed to something else
          const isCurrentlySelf = initialData?.relation?.toLowerCase() === "self";
          const isChangingFromSelf = isCurrentlySelf && value?.toLowerCase() !== "self";
          
          // Count total "Self" profiles
          const selfProfilesCount = savedKundlis.filter(
            p => p.relation?.toLowerCase() === "self"
          ).length;
          
          // Prevent changing from "Self" if this is the last Self profile
          if (isChangingFromSelf && selfProfilesCount === 1) {
            return false;
          }
          return true;
        }
      ),
    birthDate: Yup.string().required("Birth date is required"),
    birthTime: Yup.string().when("unknownBirthTime", {
      is: false,
      then: (schema) => schema.required("Birth time is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    birthPlace: Yup.string().required("Place of birth is required"),
  });
  

  // Populate form data when modal opens
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || "",
        identity: initialData.identity || "Male",
        relation: initialData.relation || "",
        birthDate: initialData.birthDate || "",
        birthTime: initialData.birthTime || "",
        birthPlace: initialData.birthPlace || "",
        unknownBirthTime: initialData.unknownBirthTime || false,
        latitude: initialData.latitude || null,
        longitude: initialData.longitude || null,
        timezone: initialData.timezone ?? 5.5,
      });
      setIsEditing(false);
      setDateInputError("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (values) => {
    // Block submission if the date input has an error (incomplete/invalid year)
    if (dateInputError) {
      return;
    }

    if (!values.latitude || !values.longitude) {
      Toast.error("Please select a valid location from the dropdown");
      return;
    }

    // Check if this is the last "Self" profile being changed to something else
    const isCurrentlySelf = initialData?.relation?.toLowerCase() === "self";
    const isChangingFromSelf = isCurrentlySelf && values.relation?.toLowerCase() !== "self";
    
    // Count total "Self" profiles
    const selfProfilesCount = savedKundlis.filter(
      p => p.relation?.toLowerCase() === "self"
    ).length;
    
    // Prevent changing from "Self" if this is the last Self profile
    if (isChangingFromSelf && selfProfilesCount === 1) {
      Toast.error("Cannot change the last Self profile. At least one Self profile is required.");
      return;
    }

    // Validate: Prevent setting "Self" if another profile already has it
    // Allow if the current profile being edited is already "Self"
    if (
      values.relation?.toLowerCase() === "self" && 
      hasSelfProfile && 
      initialData?.relation?.toLowerCase() !== "self"
    ) {
      Toast.error("A Self profile already exists. Please select a different relation.");
      return;
    }

    try {
      await onSubmit(values);
    } catch (err) {
      // Error handling is done in parent
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setDateInputError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.sideSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <div className={styles.sheetHandle}></div>
          <button className={styles.closeBtn} onClick={handleClose}>
            ×
          </button>
          <h2 className={styles.sheetTitle}>{title}</h2>
        </div>

        <div className={styles.sheetContent}>
          <Formik
            initialValues={formData}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={!isEditing}
          >
            {({ values, setFieldValue }) => (
              <Form className={styles.profileForm} onChange={() => setIsEditing(true)}>
                <div className={styles.formGroup}>
                  <label>Name <span className={styles.required}>*</span></label>
                  <Field
                    type="text"
                    name="name"
                    placeholder="Enter here"
                  />
                  <ErrorMessage name="name" component="div" className={styles.errorText} />
                </div>

                <div className={styles.formGroup}>
                  <label>Identity</label>
                  <div className={styles.identityButtons}>
                    <button
                      type="button"
                      className={values.identity === "Male" ? styles.active : ""}
                      onClick={() => setFieldValue("identity", "Male")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M6.75 14C9.37335 14 11.5 11.8734 11.5 9.25C11.5 6.62665 9.37335 4.5 6.75 4.5C4.12665 4.5 2 6.62665 2 9.25C2 11.8734 4.12665 14 6.75 14Z"
                          stroke="#000000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 5V2M14 2H11M14 2L10.125 5.875"
                          stroke="#000000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Male
                    </button>
                    <button
                      type="button"
                      className={values.identity === "Female" ? styles.active : ""}
                      onClick={() => setFieldValue("identity", "Female")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M8 10.5C10.6234 10.5 12.75 8.37335 12.75 5.75C12.75 3.12665 10.6234 1 8 1C5.37665 1 3.25 3.12665 3.25 5.75C3.25 8.37335 5.37665 10.5 8 10.5Z"
                          stroke="#000000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 10.5V15M9.8125 13H6.1875"
                          stroke="#000000"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Female
                    </button>
                    <button
                      type="button"
                      className={values.identity === "Others" ? styles.active : ""}
                      onClick={() => setFieldValue("identity", "Others")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_5605_4231)">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M2.62188 1.22009C2.74075 1.22009 2.85474 1.17287 2.93879 1.08882C3.02284 1.00477 3.07006 0.890775 3.07006 0.77191C3.07006 0.653046 3.02284 0.539049 2.93879 0.454999C2.85474 0.370949 2.74075 0.32373 2.62188 0.32373H0.829161C0.710297 0.32373 0.5963 0.370949 0.51225 0.454999C0.4282 0.539049 0.380981 0.653046 0.380981 0.77191V2.56463C0.380981 2.6835 0.4282 2.79749 0.51225 2.88154C0.5963 2.96559 0.710297 3.01281 0.829161 3.01281C0.948026 3.01281 1.06202 2.96559 1.14607 2.88154C1.23012 2.79749 1.27734 2.6835 1.27734 2.56463V1.85382L3.85572 4.4322C3.90197 4.47854 3.95781 4.51418 4.01931 4.53662C3.68903 5.17358 3.51715 5.88076 3.51824 6.59825C3.51824 8.92206 5.28721 10.8331 7.55186 11.0576V13.7378H6.6555C6.53664 13.7378 6.42264 13.785 6.33859 13.869C6.25454 13.9531 6.20732 14.0671 6.20732 14.1859C6.20732 14.3048 6.25454 14.4188 6.33859 14.5028C6.42264 14.5869 6.53664 14.6341 6.6555 14.6341H7.55186V15.5619C7.55186 15.6807 7.59908 15.7947 7.68313 15.8788C7.76718 15.9628 7.88118 16.01 8.00004 16.01C8.11891 16.01 8.2329 15.9628 8.31695 15.8788C8.401 15.7947 8.44822 15.6807 8.44822 15.5619V14.6341H9.34458C9.46345 14.6341 9.57744 14.5869 9.66149 14.5028C9.74554 14.4188 9.79276 14.3048 9.79276 14.1859C9.79276 14.0671 9.74554 13.9531 9.66149 13.869C9.57744 13.785 9.46345 13.7378 9.34458 13.7378H8.44822V11.0576C10.7129 10.8331 12.4818 8.92206 12.4818 6.59825C12.4828 5.89589 12.3181 5.20321 12.0009 4.57651L12.9439 3.63937L13.5848 4.28026C13.6265 4.32187 13.6759 4.35488 13.7303 4.37739C13.7847 4.39989 13.843 4.41147 13.9018 4.41145C13.9607 4.41143 14.019 4.39981 14.0734 4.37726C14.1277 4.35472 14.1772 4.32168 14.2188 4.28004C14.2604 4.2384 14.2934 4.18897 14.3159 4.13458C14.3384 4.08018 14.35 4.02189 14.3499 3.96302C14.3499 3.90415 14.3383 3.84586 14.3158 3.79148C14.2932 3.73711 14.2602 3.6877 14.2185 3.64609L13.5799 3.00743L14.7227 1.87174V2.56463C14.7227 2.6835 14.77 2.79749 14.854 2.88154C14.9381 2.96559 15.0521 3.01281 15.1709 3.01281C15.2898 3.01281 15.4038 2.96559 15.4878 2.88154C15.5719 2.79749 15.6191 2.6835 15.6191 2.56463V0.77191C15.6191 0.653046 15.5719 0.539049 15.4878 0.454999C15.4038 0.370949 15.2898 0.32373 15.1709 0.32373H13.3782C13.2593 0.32373 13.1453 0.370949 13.0613 0.454999C12.9772 0.539049 12.93 0.653046 12.93 0.77191C12.93 0.890775 12.9772 1.00477 13.0613 1.08882C13.1453 1.17287 13.2593 1.22009 13.3782 1.22009H14.1069L12.9462 2.37371L12.3169 1.74446C12.2328 1.66042 12.1188 1.61324 11.9999 1.61328C11.881 1.61332 11.767 1.66059 11.683 1.74469C11.5989 1.82878 11.5517 1.94282 11.5518 2.06171C11.5518 2.1806 11.5991 2.2946 11.6832 2.37864L12.3102 3.00519L11.5053 3.80519C11.0859 3.27789 10.5528 2.85214 9.94589 2.55972C9.33894 2.2673 8.67376 2.11577 8.00004 2.11645C7.32647 2.11573 6.66143 2.26716 6.05456 2.55942C5.44769 2.85167 4.91467 3.27722 4.49527 3.8043L4.48945 3.79847L1.91107 1.22009H2.62188ZM8.00004 3.01281C7.04912 3.01281 6.13715 3.39056 5.46475 4.06296C4.79235 4.73536 4.4146 5.64733 4.4146 6.59825C4.4146 7.54917 4.79235 8.46114 5.46475 9.13354C6.13715 9.80594 7.04912 10.1837 8.00004 10.1837C8.95096 10.1837 9.86293 9.80594 10.5353 9.13354C11.2077 8.46114 11.5855 7.54917 11.5855 6.59825C11.5855 5.64733 11.2077 4.73536 10.5353 4.06296C9.86293 3.39056 8.95096 3.01281 8.00004 3.01281Z"
                            fill="black"
                          />
                        </g>
                      </svg>
                      Others
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Relation <span className={styles.required}>*</span></label>
                  <Field
                    as="select"
                    name="relation"
                  >
                    <option value="">Select relation</option>
                    {relationOption.map((option) => {
                      return (
                        <option key={option.id} value={option.value}>
                          {option.title}
                        </option>
                      );
                    })}
                  </Field>
                  <ErrorMessage name="relation" component="div" className={styles.errorText} />
                </div>

                <div className={styles.formGroup}>
                  <label>Birth Date <span className={styles.required}>*</span></label>
                  {/* <Field type="date" name="birthDate" max={new Date().toISOString().split("T")[0]} onClick={(e) => e.target.showPicker?.()} /> */}
                  <DateTimePicker
                    mode="date"
                    selected={values.birthDate ? new Date(values.birthDate) : null}
                    onChange={(date) => {
                      setIsEditing(true);
                      if (date) {
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, "0");
                        const dd = String(date.getDate()).padStart(2, "0");
                        setFieldValue("birthDate", `${yyyy}-${mm}-${dd}`);
                        setDateInputError("");
                      } else {
                        setFieldValue("birthDate", "");
                      }
                    }}
                    onRawChange={(rawText) => {
                      setIsEditing(true);
                      if (!rawText) {
                        setFieldValue("birthDate", "");
                        setDateInputError("");
                      }
                    }}
                    onError={(err) => setDateInputError(err)}
                    placeholder="DD/MM/YYYY"
                  />
                  {dateInputError ? (
                    <div className={styles.errorText}>{dateInputError}</div>
                  ) : (
                    <ErrorMessage name="birthDate" component="div" className={styles.errorText} />
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Birth Time <span className={styles.required}>*</span></label>
                  {/* <Field type="time" name="birthTime" disabled={values.unknownBirthTime} onClick={(e) => !values.unknownBirthTime && e.target.showPicker?.()} /> */}
                  <DateTimePicker
                    mode="time"
                    selected={values.birthTime ? (() => { const [h, m] = values.birthTime.split(":"); const d = new Date(); d.setHours(h, m, 0, 0); return d; })() : null}
                    onChange={(date) => {
                      if (date) {
                        const hh = String(date.getHours()).padStart(2, "0");
                        const mm = String(date.getMinutes()).padStart(2, "0");
                        setFieldValue("birthTime", `${hh}:${mm}`);
                      } else {
                        setFieldValue("birthTime", "");
                      }
                    }}
                    placeholder="HH:MM AM/PM"
                    disabled={values.unknownBirthTime}
                  />
                  <ErrorMessage name="birthTime" component="div" className={styles.errorText} />
                  <div className={styles.checkboxLabel}>
                    <Field
                      type="checkbox"
                      name="unknownBirthTime"
                    />
                    <span>Don't know the exact time of birth</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Place of Birth <span className={styles.required}>*</span></label>
                  <LocationSearch
                    value={values.birthPlace}
                    onChange={(e) => setFieldValue("birthPlace", e.target.value)}
                    onPlaceSelect={(place) => {
                      setFieldValue("birthPlace", place.address);
                      setFieldValue("latitude", place.lat);
                      setFieldValue("longitude", place.lng);
                      setFieldValue("timezone", place.timezone ?? 5.5);
                    }}
                  />
                  <ErrorMessage name="birthPlace" component="div" className={styles.errorText} />
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Save Profile"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
