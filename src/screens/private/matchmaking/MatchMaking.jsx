import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationSearch from "../../../utils/location/locationSearch";
import styles from "./MatchMaking.module.scss";
import PrimaryText from "../../../component/PrimaryText";
import { PATH } from "../../../utils/routes/Paths";
import SavedKundliList from "../../../component/UI/Form/SavedKundliList";
import {
  useCreateKundliMutation,
  useDeleteKundliMutation,
  useGetAllKundlisQuery,
} from "../../../services/appServices/kundliServicesNew";

const MatchMaking = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("verifyOtpToken");
  const [isBoy, setIsBoy] = useState(true);
  const [selectedKundliId, setSelectedKundliId] = useState(null);

  const { data, isLoading } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const monthMap = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };

  const onDelete = async (id) => {
    try {
      await deleteKundli(id).unwrap();

      if (selectedKundliId === id) {
        setFormData(initialFormData);
        setSelectedKundliId(null);
      }
    } catch (err) {
      console.log("Delete failed", err);
    }
  };

  const savedKundlis = data?.data || [];

  const [formData, setFormData] = useState({
    boyData: {
      name: "",
      dob: "",
      tob: "",
      place: { address: "", lat: null, lng: null },
    },
    girlData: {
      name: "",
      dob: "",
      tob: "",
      place: { address: "", lat: null, lng: null },
    },
  });

  const [errors, setErrors] = useState({
    boyData: {},
    girlData: {},
  });

  const handleSelectKundli = (kundli) => {
    console.log("Selected Kundli:", kundli);
    setSelectedKundliId(kundli._id);

    const personKey =
      kundli.gender.toLowerCase() === "male" ? "boyData" : "girlData";
    setIsBoy(kundli.gender.toLowerCase() === "male");

    setFormData((prev) => ({
      ...prev,
      [personKey]: {
        ...prev[personKey],
        name: kundli.name,
        dob: formatDateInput(kundli.year, kundli.month, kundli.day),
        tob: formatTimeInput(kundli.hour, kundli.min),
        place: { address: kundli.place, lat: kundli.lat, lng: kundli.lon },
      },
    }));
  };

  // --- Update single field for specific person ---
  const handleChange = (person, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [person]: { ...prev[person], [field]: value },
    }));
  };

  const pad = (num) => String(num).padStart(2, "0");

  const formatDateInput = (y, m, d) => {
    return `${y}-${pad(m)}-${pad(d)}`;
  };

  const formatTimeInput = (h, min) => {
    return `${pad(h)}:${pad(min)}`;
  };

  // --- Handle place select (Boy/Girl) ---
  const handlePlaceSelect = (person, loc) => {
    setFormData((prev) => ({
      ...prev,
      [person]: {
        ...prev[person],
        place: { address: loc.address, lat: loc.lat, lng: loc.lng },
      },
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // --- Validation logic for one person ---
  const validatePerson = (data) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = "Name is required";
    if (!data.dob) newErrors.dob = "Date of Birth is required";
    if (!data.tob) newErrors.tob = "Time of Birth is required";
    if (!data.place.address) newErrors.place = "Birth Place is required";
    else if (!data.place.lat || !data.place.lng)
      newErrors.place = "Please select a valid location";
    return newErrors;
  };

  // --- On Generate Horoscope click ---
  const handleGenerate = () => {
    const boyErrors = validatePerson(formData.boyData);
    const girlErrors = validatePerson(formData.girlData);

    setErrors({ boyData: boyErrors, girlData: girlErrors });

    // If any errors exist
    if (Object.keys(boyErrors).length > 0) {
      setIsBoy(true);
      return;
    }
    if (Object.keys(girlErrors).length > 0) {
      setIsBoy(false);
      return;
    }
    const boyPayload = {
      name: formData.boyData.name,
      gender: "Male",
      day: Number(formData.boyData.dob.split("-")[2]),
      month: Number(formData.boyData.dob.split("-")[1]),
      year: Number(formData.boyData.dob.split("-")[0]),
      hour: Number(formData.boyData.tob.split(":")[0]),
      min: Number(formData.boyData.tob.split(":")[1]),
      second: 0,
      place: formData.boyData.place.address,
      lat: Number(formData.boyData.place.lat),
      lon: Number(formData.boyData.place.lng),
      tzone: 5.5,
    };
    const girlPayload = {
      name: formData.girlData.name,
      gender: "Female",
      day: Number(formData.girlData.dob.split("-")[2]),
      month: Number(formData.girlData.dob.split("-")[1]),
      year: Number(formData.girlData.dob.split("-")[0]),
      hour: Number(formData.girlData.tob.split(":")[0]),
      min: Number(formData.girlData.tob.split(":")[1]),
      second: 0,
      place: formData.girlData.place.address,
      lat: Number(formData.girlData.place.lat),
      lon: Number(formData.girlData.place.lng),
      tzone: 5.5,
    };
    console.log(boyPayload, "boyPayload");
    console.log(girlPayload, "girlPayload");
    createKundli(boyPayload);
    createKundli(girlPayload);
    navigate(PATH.privateRoutes.MATCHMAKING_DETAILS.path, { state: formData });
  };

  // --- Render individual form ---
  const renderForm = (personKey, title) => {
    const data = formData[personKey];
    const err = errors[personKey];
    const today = new Date().toISOString().split("T")[0];

    return (
      <div>
        <h2 className={styles.formTitle}>— {title.toUpperCase()} —</h2>

        <div className={styles.formFields}>
          {/* Name */}
          <div className={styles.formGroup}>
            <label>Name*</label>
            <input
              type="text"
              placeholder="Enter full name"
              value={data.name}
              onChange={(e) => handleChange(personKey, "name", e.target.value)}
              className={err.name ? styles.inputError : ""}
            />
            {err.name && <p className={styles.error}>{err.name}</p>}
          </div>

          {/* DOB */}
          <div className={styles.formGroup}>
            <label>Date of Birth*</label>
            <input
              type="date"
              value={data.dob}
              onChange={(e) => handleChange(personKey, "dob", e.target.value)}
              onClick={(e) => e.target.showPicker?.()}
              className={err.dob ? styles.inputError : ""}
              max={today}
            />
            {err.dob && <p className={styles.error}>{err.dob}</p>}
          </div>

          {/* TOB */}
          <div className={styles.formGroup}>
            <label>Time of Birth*</label>
            <input
              type="time"
              value={data.tob}
              onChange={(e) => handleChange(personKey, "tob", e.target.value)}
              onClick={(e) => e.target.showPicker?.()}
              className={err.tob ? styles.inputError : ""}
            />
            {err.tob && <p className={styles.error}>{err.tob}</p>}
          </div>

          {/* Birth Place */}
          <div className={styles.formGroup}>
            <label>Birth Place*</label>
            <LocationSearch
              value={data.place.address}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [personKey]: {
                    ...prev[personKey],
                    place: {
                      ...prev[personKey].place,
                      address: e.target.value,
                    },
                  },
                }))
              }
              onPlaceSelect={(loc) => handlePlaceSelect(personKey, loc)}
            />
            {err.place && <p className={styles.error}>{err.place}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.tabContainer}>
        <PrimaryText marginBottom="1rem" isCenter size_18>
          Enter Your Partner's Detail
        </PrimaryText>
        <div className={styles.switchTabs}>
          <span
            onClick={() => setIsBoy(true)}
            className={isBoy ? styles.activeTab : ""}
          >
            Boy's Detail
          </span>
          <span
            onClick={() => setIsBoy(false)}
            className={!isBoy ? styles.activeTab : ""}
          >
            Girl's Detail
          </span>
        </div>
      </div>
      <div className={styles.mainContainer}>
        <div className={styles.dailyContainer}>
          <div className={styles.formArea}>
            {isBoy
              ? renderForm("boyData", "Boy's Detail")
              : renderForm("girlData", "Girl's Detail")}

            <button className={styles.generateBtn} onClick={handleGenerate}>
              Generate Horoscope
            </button>
          </div>
        </div>
        <div className={` ${styles.kundliListContainer} p-4 xs:mt[0] `}>
          <SavedKundliList
            title="Saved Matches"
            token={token}
            isLoading={isLoading}
            kundlis={savedKundlis}
            selectedKundliId={selectedKundliId}
            onSelect={handleSelectKundli}
            onDelete={onDelete}
            onLoginNavigate={() => navigate("/login")}
          />
        </div>
      </div>
    </div>
  );
};

export default MatchMaking;
