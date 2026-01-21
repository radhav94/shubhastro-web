import React, { useState } from "react";
import { createPortal } from "react-dom";
import styles from "./KundliSelectModal.module.scss";
import { IoClose } from "react-icons/io5";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { padZero } from "../../../../utils/dateFormat/dateTime";
import Toast from "../../../../component/toast";

import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
} from "../../../../services/appServices/kundliServicesNew";
import LocationSearch from "../../../../utils/location/locationSearchVedic";

const initialForm = {
  name: "",
  identity: "",
  relation: "",
  birthDate: "",
  birthTime: "",
  unknownBirthTime: false,
  birthPlace: "",
  latitude: null,
  longitude: null,
};

const KundliSelectModal = ({ isOpen, onClose, onSelect }) => {
  const role = localStorage.getItem("shubhtalk_role");

  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  const { data, isLoading, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token || !isOpen,
  });

  const [createKundli] = useCreateKundliMutation();
  const kundlis = data?.data || [];

  const [showAddProfile, setShowAddProfile] = useState(false);
  const [selectedKundli, setSelectedKundli] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  const formatProfileDisplay = (profile) => {
    const initials = profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const birthDate = profile.birthDate || `${padZero(profile.day)}-${padZero(profile.month)}-${profile.year}`;
    const birthTime = profile.birthTime || `${padZero(profile.hour)}:${padZero(profile.min)}`;
    const relation = profile.relation || "Self";

    return { initials, birthDate, birthTime, relation };
  };

  const handleAddProfile = () => {
    setShowAddProfile(true);
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const [year, month, day] = form.birthDate.split("-");
      const [hour, minute] = form.birthTime ? form.birthTime.split(":") : ["12", "0"];

      const payload = {
        name: form.name,
        gender: form.identity.toLowerCase(),
        relation: form.relation,
        day: Number(day),
        month: Number(month),
        year: Number(year),
        hour: form.unknownBirthTime ? 12 : Number(hour),
        min: form.unknownBirthTime ? 0 : Number(minute),
        second: 0,
        place: form.birthPlace,
        lat: Number(form.latitude),
        lon: Number(form.longitude),
        tzone: 5.5,
        birthDate: form.birthDate,
        birthTime: form.unknownBirthTime ? "" : form.birthTime,
      };

      const res = await createKundli(payload).unwrap();
      Toast.success("Profile added successfully");
      setShowAddProfile(false);
      setForm(initialForm);
      refetch();
    } catch (err) {
      console.error(err);
      Toast.error(err?.data?.message || "Failed to add profile");
    } finally {
      setCreating(false);
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
                  onClick={() => selectedKundli && onSelect(selectedKundli)}
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
