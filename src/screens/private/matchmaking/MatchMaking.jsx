import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import styles from "./MatchMaking.module.scss";
import PrimaryText from "../../../component/PrimaryText";
import { PATH } from "../../../utils/routes/Paths";
import SavedKundliList from "../../../component/UI/Form/SavedKundliList";
import DateTimePicker from "../../../component/UI/dateTimePicker/DateTimePicker";
import {
  useCreateKundliMutation,
  useDeleteKundliMutation,
  useGetAllKundlisQuery,
} from "../../../services/appServices/kundliServicesNew";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";

const isDuplicateKundli = (payload, list) => {
  return list.some(
    (k) =>
      k.name.trim().toLowerCase() === payload.name.trim().toLowerCase() &&
      k.gender.toLowerCase() === payload.gender.toLowerCase() &&
      Number(k.day) === Number(payload.day) &&
      Number(k.month) === Number(payload.month) &&
      Number(k.year) === Number(payload.year) &&
      Number(k.hour) === Number(payload.hour) &&
      Number(k.min) === Number(payload.min) &&
      Number(k.lat) === Number(payload.lat) &&
      Number(k.lon) === Number(payload.lon) &&
      k.place.trim().toLowerCase() === payload.place.trim().toLowerCase(),
  );
};
const initialFormData = {
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
  const prevTokenRef = useRef(null);
  const { data, isLoading, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const savedKundlis = data?.data || [];

  const onDelete = async (id) => {
    try {
      await deleteKundli(id).unwrap();

      if (selectedKundliId === id) {
        setSelectedKundliId(null);
        setFormData(initialFormData);
        setIsBoy(true);
      }

      refetch();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };
  const [formData, setFormData] = useState(initialFormData);
  /* --------------------- TOKEN CHANGE HANDLING ---------------------- */
  useEffect(() => {
    const prevToken = prevTokenRef.current;
    // CASE 1: First login (null → token)
    if (!prevToken && token && refetch) {
      refetch();
    }
    // CASE 2: User switched (token A → token B)
    if (prevToken && token && prevToken !== token) {
      setFormData(initialFormData);
      setSelectedKundliId(null);
      setIsBoy(true);
      refetch();
    }
    // CASE 3: Logout (token → null)
    if (prevToken && !token) {
      setFormData(initialFormData);
      setSelectedKundliId(null);
      setIsBoy(true);
    }

    prevTokenRef.current = token;
  }, [token, refetch]);

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
        place: {
          address: kundli.place,
          lat: kundli.lat,
          lng: kundli.lon,
        },
      },
    }));
  };

  const handleChange = (person, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [person]: { ...prev[person], [field]: value },
    }));
  };

  const pad = (num) => String(num).padStart(2, "0");

  const formatDateInput = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const formatTimeInput = (h, min) => `${pad(h)}:${pad(min)}`;

  const handlePlaceSelect = (person, loc) => {
    setFormData((prev) => ({
      ...prev,
      [person]: {
        ...prev[person],
        place: { address: loc.address, lat: loc.lat, lng: loc.lng },
      },
    }));
  };

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

  const handleGenerate = (e) => {
    e.preventDefault();

    // if (!token) {
    //   navigate("/login", { state: { from: location.pathname } });
    //   return;
    // }

    const boyErrors = validatePerson(formData.boyData);
    const girlErrors = validatePerson(formData.girlData);

    setErrors({ boyData: boyErrors, girlData: girlErrors });

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
      place: formData.boyData.place.address.trim(),
      lat: Number(formData.boyData.place.lat),
      lon: Number(formData.boyData.place.lng),
      tzone: formData.boyData.place.timezone ?? 5.5,
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
      place: formData.girlData.place.address.trim(),
      lat: Number(formData.girlData.place.lat),
      lon: Number(formData.girlData.place.lng),
      tzone: formData.girlData.place.timezone ?? 5.5,
    };

    // -----------------------------------------------------
    // 🔥 FIXED: DO NOT CREATE KUNDLI IF USER SELECTED ONE
    // -----------------------------------------------------
    const selected = savedKundlis.find((k) => k._id === selectedKundliId);

    if (token) {
      // 🔹 CASE 1: Selected kundli exists
      if (selected) {
        const selectedGender = selected.gender.toLowerCase();
        if (selectedGender === "female") {
          if (!isDuplicateKundli(boyPayload, savedKundlis)) {
            createKundli(boyPayload);
          }
        }
        if (selectedGender === "male") {
          if (!isDuplicateKundli(girlPayload, savedKundlis)) {
            createKundli(girlPayload);
          }
        }
      } else {
        if (!isDuplicateKundli(boyPayload, savedKundlis)) {
          createKundli(boyPayload);
        }

        if (!isDuplicateKundli(girlPayload, savedKundlis)) {
          createKundli(girlPayload);
        }
      }
    }

    navigate(PATH.privateRoutes.MATCHMAKING_DETAILS.path, { state: formData });
  };

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
            {/* <input type="date" value={data.dob} onChange={(e) => handleChange(personKey, "dob", e.target.value)} onClick={(e) => e.target.showPicker?.()} className={err.dob ? styles.inputError : ""} max={today} /> */}
            <DateTimePicker
              mode="date"
              selected={data.dob ? new Date(data.dob) : null}
              onChange={(date) => {
                if (date) {
                  const yyyy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, "0");
                  const dd = String(date.getDate()).padStart(2, "0");
                  handleChange(personKey, "dob", `${yyyy}-${mm}-${dd}`);
                } else {
                  handleChange(personKey, "dob", "");
                }
              }}
              maxDate={new Date()}
              placeholder="DD/MM/YYYY"
            />
            {err.dob && <p className={styles.error}>{err.dob}</p>}
          </div>

          {/* TOB */}
          <div className={styles.formGroup}>
            <label>Time of Birth*</label>
            {/* <input type="time" value={data.tob} onChange={(e) => handleChange(personKey, "tob", e.target.value)} onClick={(e) => e.target.showPicker?.()} className={err.tob ? styles.inputError : ""} /> */}
            <DateTimePicker
              mode="time"
              selected={data.tob ? (() => { const [h, m] = data.tob.split(":"); const d = new Date(); d.setHours(h, m, 0, 0); return d; })() : null}
              onChange={(date) => {
                if (date) {
                  const hh = String(date.getHours()).padStart(2, "0");
                  const mm = String(date.getMinutes()).padStart(2, "0");
                  handleChange(personKey, "tob", `${hh}:${mm}`);
                } else {
                  handleChange(personKey, "tob", "");
                }
              }}
              placeholder="Select time"
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
              Match Horoscope
            </button>
          </form>
        </div>

        <div className={`${styles.kundliListContainer} p-4 xs:mt[0]`}>
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
