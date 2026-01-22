import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import styles from "./KundliSelectModal.module.scss";
import { IoClose } from "react-icons/io5";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { padZero } from "../../../../utils/dateFormat/dateTime";
import Toast from "../../../../component/toast";
import { setForm } from "../../../../redux/kundliform/formSlice";

import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
} from "../../../../services/appServices/kundliServicesNew";
import LocationSearch from "../../../../utils/location/locationSearchVedic";

const initialForm = {
  name: "",
  identity: "Male",
  relation: "",
  birthDate: "",
  birthTime: "",
  unknownBirthTime: false,
  birthPlace: "",
  latitude: null,
  longitude: null,
};

const KundliSelectModal = ({ isOpen, onClose, onSelect }) => {
  const dispatch = useDispatch();
  const role = localStorage.getItem("shubhtalk_role");

  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  const { data, isLoading, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token || !isOpen,
  });

  const [createKundli] = useCreateKundliMutation();
  const kundlis = Array.isArray(data?.data) ? data.data : [];

  const [showAddProfile, setShowAddProfile] = useState(false);
  const [selectedKundli, setSelectedKundli] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  // Debug log
  console.log("KundliSelectModal - data:", data);
  console.log("KundliSelectModal - kundlis:", kundlis);

  const formatProfileDisplay = (profile) => {
    if (!profile) return { initials: "?", birthDate: "", birthTime: "", relation: "Self" };
    
    const initials = profile.name
      ? profile.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const birthDate = profile.day && profile.month && profile.year
      ? `${String(profile.day).padStart(2, '0')} ${monthNames[profile.month - 1] || ""} ${profile.year}`
      : "";
    
    const hour12 = profile.hour > 12 ? profile.hour - 12 : profile.hour === 0 ? 12 : profile.hour;
    const meridiem = profile.hour >= 12 ? 'PM' : 'AM';
    const birthTime = profile.hour !== undefined && profile.min !== undefined
      ? `${String(hour12).padStart(2, '0')}:${String(profile.min).padStart(2, '0')} ${meridiem}`
      : "";
    
    const relation = profile.relation || "Self";

    return { initials, birthDate, birthTime, relation };
  };

  const handleAddProfile = () => {
    setShowAddProfile(true);
  };

  const buildKundliPayload = (data) => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(':') : ['12', '0'];
    
    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
      relation: data.relation,
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      hour: data.unknownBirthTime ? 12 : parseInt(timeObj[0]),
      min: data.unknownBirthTime ? 0 : parseInt(timeObj[1]),
      second: 0,
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: 5.5,
      birthDate: data.birthDate,
      birthTime: data.unknownBirthTime ? "" : data.birthTime,
    };
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    if (!form.birthPlace) {
      Toast.error("Please enter birth place");
      return;
    }

    setCreating(true);

    try {
      const payload = buildKundliPayload(form);
      const result = await createKundli(payload).unwrap();
      
      Toast.success("Profile added successfully");
      setShowAddProfile(false);
      setForm(initialForm);
      refetch();

      // Dispatch to Redux for kundli page compatibility
      if (result?.data) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const profileData = result.data;
        const meridiem = profileData.hour >= 12 ? "PM" : "AM";
        const hour12 = profileData.hour > 12 ? profileData.hour - 12 : profileData.hour === 0 ? 12 : profileData.hour;

        const profilePayload = {
          name: profileData.name,
          gender: profileData.gender === "male" ? "Male" : profileData.gender === "female" ? "Female" : "Others",
          day: String(profileData.day),
          month: months[profileData.month - 1],
          year: String(profileData.year),
          hour: String(hour12),
          minute: String(profileData.min),
          meridiem,
          birthPlace: profileData.place,
          latitude: profileData.lat,
          longitude: profileData.lon,
        };

        dispatch(setForm(profilePayload));
      }
    } catch (err) {
      console.error(err);
      Toast.error(err?.data?.message || "Failed to add profile");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectAndContinue = () => {
    if (!selectedKundli) {
      Toast.error("Please select a profile");
      return;
    }

    try {
      // Dispatch to Redux
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const meridiem = selectedKundli.hour >= 12 ? "PM" : "AM";
      const hour12 = selectedKundli.hour > 12 ? selectedKundli.hour - 12 : selectedKundli.hour === 0 ? 12 : selectedKundli.hour;

      const profilePayload = {
        name: selectedKundli.name || "",
        gender: selectedKundli.gender === "male" ? "Male" : selectedKundli.gender === "female" ? "Female" : "Others",
        day: String(selectedKundli.day || 1),
        month: months[(selectedKundli.month || 1) - 1] || "Jan",
        year: String(selectedKundli.year || new Date().getFullYear()),
        hour: String(hour12 || 12),
        minute: String(selectedKundli.min || 0),
        meridiem,
        birthPlace: selectedKundli.place || "",
        latitude: selectedKundli.lat || 0,
        longitude: selectedKundli.lon || 0,
      };

      console.log("📤 Dispatching setForm with payload:", profilePayload);
      dispatch(setForm(profilePayload));
      
      console.log("✅ Calling onSelect with kundli:", selectedKundli);
      onSelect(selectedKundli);
    } catch (error) {
      console.error("❌ Error in handleSelectAndContinue:", error);
      Toast.error("Failed to select profile");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Select Profile Modal */}
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
          <div className={styles.sheetHandle}></div>

          <div className={styles.sheetContent}>
            <button className={styles.closeBtn} onClick={onClose}>
              ×
            </button>
            <h2 className={styles.sheetTitle}>Select Profile</h2>

            {isLoading ? (
              <PrimaryLoader />
            ) : kundlis.length > 0 ? (
              <>
                <div className={styles.profileList}>
                  {kundlis.map((profile) => {
                    const formatted = formatProfileDisplay(profile);
                    return (
                      <div
                        key={profile._id}
                        className={`${styles.profileItem} ${
                          selectedKundli?._id === profile._id ? styles.selected : ""
                        }`}
                        onClick={() => setSelectedKundli(profile)}
                      >
                        <div className={styles.profileAvatar}>
                          {formatted.initials}
                        </div>
                        <div className={styles.profileInfo}>
                          <span className={styles.relationBadge}>
                            {formatted.relation}
                          </span>
                          <h3 className={styles.profileName}>{profile.name}</h3>
                          <p className={styles.profileDetails}>
                            {formatted.birthDate} • {formatted.birthTime}
                          </p>
                          <p className={styles.profileLocation}>{profile.place}</p>
                        </div>
                        <div className={styles.radioBtn}>
                          {selectedKundli?._id === profile._id ? "●" : "○"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className={styles.addProfileBtn} onClick={handleAddProfile}>
                  + Add Profile
                </button>

                <button
                  className={styles.continueBtn}
                  disabled={!selectedKundli}
                  onClick={handleSelectAndContinue}
                >
                  Continue
                </button>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>No saved profiles found.</p>
                <button className={styles.addProfileBtn} onClick={handleAddProfile}>
                  + Add Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Profile Side Sheet */}
      {showAddProfile && (
        <div className={styles.modalOverlay} onClick={() => setShowAddProfile(false)}>
          <div className={styles.sideSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle}></div>

            <div className={styles.sheetContent}>
              <button className={styles.closeBtn} onClick={() => setShowAddProfile(false)}>
                ×
              </button>
              <h2 className={styles.sheetTitle}>Add Profile</h2>

              <form onSubmit={handleSubmitProfile} className={styles.profileForm}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder="Enter here"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Identity</label>
                  <div className={styles.identityButtons}>
                    <button
                      type="button"
                      className={form.identity === "Male" ? styles.active : ""}
                      onClick={() => setForm({ ...form, identity: "Male" })}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      className={form.identity === "Female" ? styles.active : ""}
                      onClick={() => setForm({ ...form, identity: "Female" })}
                    >
                      Female
                    </button>
                    <button
                      type="button"
                      className={form.identity === "Others" ? styles.active : ""}
                      onClick={() => setForm({ ...form, identity: "Others" })}
                    >
                      Others
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Relation</label>
                  <select
                    value={form.relation}
                    onChange={(e) => setForm({ ...form, relation: e.target.value })}
                    required
                  >
                    <option value="">Select relation</option>
                    <option value="Self">Self</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Birth Date</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Birth Time</label>
                  <input
                    type="time"
                    value={form.birthTime}
                    onChange={(e) => setForm({ ...form, birthTime: e.target.value })}
                    disabled={form.unknownBirthTime}
                  />
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.unknownBirthTime}
                      onChange={(e) =>
                        setForm({ ...form, unknownBirthTime: e.target.checked })
                      }
                    />
                    Don't know the exact time of birth
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label>Place of Birth</label>
                  <LocationSearch
                    value={form.birthPlace}
                    onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                    onPlaceSelect={(place) =>
                      setForm({
                        ...form,
                        birthPlace: place.address,
                        latitude: place.lat,
                        longitude: place.lng,
                      })
                    }
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={creating}>
                  {creating ? "Adding..." : "Add Profile"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default KundliSelectModal;
