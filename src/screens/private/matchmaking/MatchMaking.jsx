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
import PrimaryLoader from "../../../component/UI/PrimaryLoader";

const isDuplicateKundli = (payload, list) => {
  return list.some(
    (k) =>
      k.name === payload.name &&
      k.gender === payload.gender &&
      k.day === payload.day &&
      k.month === payload.month &&
      k.year === payload.year &&
      Number(k.hour) === Number(payload.hour) &&
      Number(k.min) === Number(payload.min) &&
      Number(k.second) === Number(payload.second) &&
      Number(k.lat) === Number(payload.lat) &&
      Number(k.lon) === Number(payload.lon) &&
      k.place === payload.place &&
      Number(k.tzone) === Number(payload.tzone)
  );
};

const MatchMaking = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("shubhtalk_role");
const token =
  role === "ASTROLOGER"
    ? localStorage.getItem("shubhtalk_astro_token")
    : localStorage.getItem("shubhtalk_customer_token");

  const [isBoy, setIsBoy] = useState(true);
  const [selectedKundliId, setSelectedKundliId] = useState(null);

  const { data, isLoading } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const onDelete = (id) => {
    deleteKundli(id);

    if (selectedKundliId === id) {
      setFormData(initialFormData);
      setSelectedKundliId(null);
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
  const handleGenerate = (e) => {
    e.preventDefault();
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
    }
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
    if (!isDuplicateKundli(boyPayload, savedKundlis)) {
      createKundli(boyPayload);
    }
    if (!isDuplicateKundli(girlPayload, savedKundlis)) {
      createKundli(girlPayload);
    }
    // createKundli(girlPayload);
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
      <PrimaryLoader isLoading={isLoading} />
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
          <form className={styles.formArea} onSubmit={handleGenerate}>
            {isBoy
              ? renderForm("boyData", "Boy's Detail")
              : renderForm("girlData", "Girl's Detail")}

            <button className={styles.generateBtn} type="submit">
              Generate Horoscope
            </button>
          </form>
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
            onLoginNavigate={() =>
              navigate("/login", { state: { from: location.pathname } })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default MatchMaking;
