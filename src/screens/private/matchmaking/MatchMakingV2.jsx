import { useState, useEffect } from "react";
import { ChevronLeft, ChevronDown, Edit2, Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import styles from "./MatchMakingV2.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import { useLazyGetNumerologyPredictionQuery } from "../../../services/appServices/numerologyServices";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import { Toast } from "../../../component";

const MatchMaking = () => {
  const navigate = useNavigate();

  /* -------------------- STATE -------------------- */
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState(null); // header display
  const [primaryProfile, setPrimaryProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [selectingType, setSelectingType] = useState(null); // PRIMARY | PARTNER

  /* -------------------- TOKEN -------------------- */
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  /* -------------------- API -------------------- */
  const { data, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli, { isLoading: isCreating }] =
    useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const [getNumerologyPrediction, { data: numerologyData }] =
    useLazyGetNumerologyPredictionQuery();
  const profiles = data?.data || [];
  const location = useLocation();
  useEffect(() => {
    if (location.state?.boyData && location.state?.girlData && profiles.length) {
      const { boyData, girlData } = location.state;
  
      const findProfile = (data) =>
        profiles.find(
          (p) =>
            p.name === data.name &&
            p.place === data.place.address &&
            p.lat === data.place.lat &&
            p.lon === data.place.lng
        );
  
      const boyProfile = findProfile(boyData);
      const girlProfile = findProfile(girlData);
  
      if (boyProfile && girlProfile) {
        setPrimaryProfile(boyProfile);
        setPartnerProfile(girlProfile);
        setSelectedProfile(boyProfile);
      }
    }
  }, [location.state, profiles]);
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
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    identity: "Male",
    relation: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    unknownBirthTime: false,
    latitude: null,
    longitude: null,
  });
  /* -------------------- AUTO SELECT -------------------- */
  useEffect(() => {
    if (profiles.length && !primaryProfile) {
      setPrimaryProfile(profiles[0]);
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, primaryProfile]);

  /* -------------------- NUMEROLOGY -------------------- */
  useEffect(() => {
    if (selectedProfile) {
      const date = `${String(selectedProfile.day).padStart(2, "0")}/${String(
        selectedProfile.month
      ).padStart(2, "0")}/${selectedProfile.year}`;
      const name = selectedProfile.name.replaceAll(" ", "");
      getNumerologyPrediction({ date, name, lang: "en" });
    }
  }, [selectedProfile, getNumerologyPrediction]);

  /* -------------------- HELPERS -------------------- */
  const buildPayloadFromProfile = (profile) => ({
    name: profile.name,
    gender: profile.gender,
    day: profile.day,
    month: profile.month,
    year: profile.year,
    hour: profile.hour,
    min: profile.min,
    second: 0,
    place: profile.place,
    lat: profile.lat,
    lon: profile.lon,
    tzone: 5.5,
  });

  const isDuplicateKundli = (payload, list) =>
    list.some(
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
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase()
    );

  /* -------------------- FILTERED LIST -------------------- */
  const filteredProfiles = profiles.filter((p) => {
    if (selectingType === "PRIMARY") {
      // Exclude current partner
      return p._id !== partnerProfile?._id;
    } else if (selectingType === "PARTNER") {
      // Exclude current primary
      return p._id !== primaryProfile?._id;
    }
    return true;
  });

  /* -------------------- SELECT PROFILE -------------------- */
  const handleSelectProfile = (profile) => {
    if (selectingType === "PRIMARY") {
      if (profile._id === partnerProfile?._id) return; // prevent selecting same as partner
      setPrimaryProfile(profile);
      setSelectedProfile(profile);
    }

    if (selectingType === "PARTNER") {
      if (profile._id === primaryProfile?._id) return; // prevent selecting same as primary
      setPartnerProfile(profile);
    }

    setShowSelectProfile(false);
    setSelectingType(null);
  };

  /* -------------------- PROCEED -------------------- */
  const handleProceed = (e) => {
    e?.preventDefault();
  
    if (!primaryProfile || !partnerProfile) {
      Toast.error("Please select both profiles");
      return;
    }
  
    const isValidProfile = (p) =>
      p.name &&
      p.day &&
      p.month &&
      p.year &&
      p.hour !== undefined &&
      p.min !== undefined &&
      p.place &&
      p.lat !== null &&
      p.lon !== null;
  
    if (!isValidProfile(primaryProfile) || !isValidProfile(partnerProfile)) {
      Toast.error("Invalid profile details");
      return;
    }
  
    const formatDate = (y, m, d) =>
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  
    const formatTime = (h, min) =>
      `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  
    const mapProfile = (p) => ({
      name: p.name,
      dob: formatDate(p.year, p.month, p.day),
      tob: formatTime(p.hour, p.min),
      place: {
        address: p.place,
        lat: p.lat,
        lng: p.lon,
      },
    });
  
    const primaryGender = primaryProfile.gender?.toLowerCase();
    const partnerGender = partnerProfile.gender?.toLowerCase();
  
    let state;
  
    // 🔹 Different gender → Male/Female mapping
    if (primaryGender !== partnerGender) {
      state =
        primaryGender === "male"
          ? {
              boyData: mapProfile(primaryProfile),
              girlData: mapProfile(partnerProfile),
            }
          : {
              boyData: mapProfile(partnerProfile),
              girlData: mapProfile(primaryProfile),
            };
    } else {
      // 🔹 Same gender → Primary = boyData, Partner = girlData
      state = {
        boyData: mapProfile(primaryProfile),
        girlData: mapProfile(partnerProfile),
      };
    }
  
    navigate(PATH.privateRoutes.MATCHMAKING_DETAILS.path, { state });
  };
  
  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    if (!formData.birthPlace) {
      Toast.error("Please enter birth place");
      return;
    }

    try {
      const payload = buildKundliPayload(formData);
      await createKundli(payload).unwrap();
      Toast.success("Profile added successfully");
      setShowAddProfile(false);
      refetch();

      // Reset form
      setFormData({
        name: "",
        identity: "Male",
        relation: "",
        birthDate: "",
        birthTime: "",
        birthPlace: "",
        unknownBirthTime: false,
        latitude: null,
        longitude: null,
      });
    } catch (err) {
      console.error(err);
      Toast.error(err?.data?.message || "Failed to add profile");
    }
  };
  const handleSubmitEditProfile = async (e) => {
    e.preventDefault();

    if (!editFormData.birthPlace) {
      Toast.error("Please enter birth place");
      return;
    }

    try {
      // Delete old profile and create new one (since there's no update endpoint)
      if (selectedProfile?._id) {
        await deleteKundli(selectedProfile._id).unwrap();
      }

      const payload = buildKundliPayload(editFormData);
      const result = await createKundli(payload).unwrap();

      Toast.success("Profile updated successfully");
      setShowEditProfile(false);
      refetch();

      // Update selected profile
      if (result?.data) {
        setSelectedProfile(result.data);
      }
    } catch (err) {
      console.error(err);
      Toast.error(err?.data?.message || "Failed to update profile");
    }
  };
  const handleEditProfile = () => {
    // Pre-fill form with selected profile data
    if (selectedProfile) {
      const birthDateTime = new Date(
        selectedProfile.year,
        selectedProfile.month - 1,
        selectedProfile.day,
        selectedProfile.hour,
        selectedProfile.min,
      );

      setEditFormData({
        name: selectedProfile.name,
        identity:
          selectedProfile.gender === "male"
            ? "Male"
            : selectedProfile.gender === "female"
              ? "Female"
              : "Others",
        relation: "Self", // You may need to add this field to API
        birthDate: `${selectedProfile.year}-${String(selectedProfile.month).padStart(2, "0")}-${String(selectedProfile.day).padStart(2, "0")}`,
        birthTime: `${String(selectedProfile.hour).padStart(2, "0")}:${String(selectedProfile.min).padStart(2, "0")}`,
        birthPlace: selectedProfile.place,
        unknownBirthTime: false,
        latitude: selectedProfile.lat,
        longitude: selectedProfile.lon,
      });
    }
    setShowEditProfile(true);
  };
  const buildKundliPayload = (data) => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(":") : ["0", "0"];

    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      hour: data.unknownBirthTime ? 0 : parseInt(timeObj[0]),
      min: data.unknownBirthTime ? 0 : parseInt(timeObj[1]),
      second: 0,
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: 5.5,
    };
  };
  const formatProfileDisplay = (profile) => {
    if (!profile)
      return { initials: "", birthDate: "", birthTime: "", relation: "" };

    const initials = profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const birthDate = `${String(profile.day).padStart(2, "0")} ${monthNames[profile.month - 1]} ${profile.year}`;

    const hour12 =
      profile.hour > 12
        ? profile.hour - 12
        : profile.hour === 0
          ? 12
          : profile.hour;
    const meridiem = profile.hour >= 12 ? "PM" : "AM";
    const birthTime = `${String(hour12).padStart(2, "0")}:${String(profile.min).padStart(2, "0")} ${meridiem}`;

    return {
      initials,
      birthDate,
      birthTime,
      relation: "Self", // You may need to add this to API
    };
  };
  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen bg-[#FFF4EA] mt-[100px] flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col">
        {/* HEADER */}
        <div className="bg-[#FFF4EA] px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"
          >
            <ChevronLeft className="text-orange-500 w-5 h-5" />
          </button>

          {/* <div className="text-left flex-1">
            <p className="text-xs text-gray-500">Select Profile</p>
            <div className="flex items-center gap-1 font-semibold text-lg">
              {selectedProfile?.name || "Select Profile"}
              <ChevronDown className="w-4 h-4 text-orange-500" />
            </div>
          </div> */}

          {/* <button
            onClick={handleEditProfile}
            disabled={!selectedProfile}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"
          >
            <Edit2 className="text-orange-500 w-5 h-5" />
          </button> */}
        </div>

        {/* CONTENT */}
        <div className="flex-1 px-4 pt-4 pb-28">
          <div className="bg-white border rounded-2xl p-6 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
                <Heart className="text-orange-500 w-7 h-7" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Bonded by Destiny</h2>
            <p className="text-gray-500 text-sm">
              Matchmaking analyzes compatibility between two charts.
            </p>
          </div>

          {/* PRIMARY */}
          <div className="mt-6">
            <label className="block font-medium mb-2">
              Select Primary Profile
            </label>
            <div
              onClick={() => {
                setSelectingType("PRIMARY");
                setShowSelectProfile(true);
              }}
              className="flex items-center justify-between border rounded-xl px-4 py-3 bg-white"
            >
              <span>{primaryProfile?.name || "Select Profile"}</span>
              <ChevronDown className="w-4 h-4 text-orange-500" />
            </div>
          </div>

          <div className="flex justify-center my-6">
            <Heart className="text-orange-500 w-6 h-6" />
          </div>

          {/* PARTNER */}
          <div>
            <label className="block font-medium mb-2">
              Select Partner’s Profile
            </label>
            <div
              onClick={() => {
                setSelectingType("PARTNER");
                setShowSelectProfile(true);
              }}
              className="flex items-center justify-between border rounded-xl px-4 py-3 bg-white"
            >
              <span className={partnerProfile ? "" : "text-gray-400"}>
                {partnerProfile?.name || "Add Profile"}
              </span>
              <ChevronDown className="w-4 h-4 text-orange-500" />
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:static md:shadow-none">
          <button
            onClick={handleProceed}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-full flex items-center justify-center gap-2"
          >
            Proceed Ahead
            <span className="text-xl">›</span>
          </button>
        </div>
      </div>

      {/* SELECT PROFILE POPUP */}
      {showSelectProfile && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowSelectProfile(false)}
        >
          <div
            className={styles.bottomSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHandle}></div>
            <div className={styles.sheetContent}>
              <button
                className={styles.closeBtn}
                onClick={() => setShowSelectProfile(false)}
              >
                ×
              </button>
              <h2 className={styles.sheetTitle}>
                {selectingType === "PRIMARY"
                  ? "Select Primary Profile"
                  : "Select Partner’s Profile"}
              </h2>

              <div className={styles.profileList}>
                {filteredProfiles.map((profile) => {
                  const formatted = formatProfileDisplay(profile);

                  return (
                    <div
                      key={profile._id}
                      className={styles.profileItem}
                      onClick={() => handleSelectProfile(profile)}
                    >
                      <div className={styles.profileAvatar}>
                        {profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>

                      <div className={styles.profileInfo}>
                      <span className={styles.relationBadge}>
                          {formatted.relation}
                        </span>
                        <h3 className={styles.profileName}>{profile.name}</h3>
                        <p className={styles.profileMeta}>
                          {formatted.birthDate} • {formatted.birthTime}
                        </p>
                        <p className={styles.profileLocation}>{profile.place}</p>
                      </div>

                      <div className={styles.radioBtn}>
                        {((selectingType === "PRIMARY" &&
                          primaryProfile?._id === profile._id) ||
                          (selectingType === "PARTNER" &&
                            partnerProfile?._id === profile._id))
                          ? "●"
                          : "○"}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className={styles.addProfileBtn}
                onClick={() => {
                  setShowAddProfile(true);
                  setShowSelectProfile(false);
                }}
              >
                + Add Profile
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Profile Modal */}
      {showAddProfile && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowAddProfile(false)}
        >
          <div
            className={styles.sideSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHandle}></div>

            <div className={styles.sheetContent}>
              <button
                className={styles.closeBtn}
                onClick={() => setShowAddProfile(false)}
              >
                ×
              </button>
              <h2 className={styles.sheetTitle}>Add Profile</h2>

              <form
                onSubmit={handleSubmitProfile}
                className={styles.profileForm}
              >
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder="Enter here"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Identity</label>
                  <div className={styles.identityButtons}>
                    <button
                      type="button"
                      className={
                        formData.identity === "Male" ? styles.active : ""
                      }
                      onClick={() =>
                        setFormData({ ...formData, identity: "Male" })
                      }
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      className={
                        formData.identity === "Female" ? styles.active : ""
                      }
                      onClick={() =>
                        setFormData({ ...formData, identity: "Female" })
                      }
                    >
                      Female
                    </button>
                    <button
                      type="button"
                      className={
                        formData.identity === "Others" ? styles.active : ""
                      }
                      onClick={() =>
                        setFormData({ ...formData, identity: "Others" })
                      }
                    >
                      Others
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Relation</label>
                  <select
                    value={formData.relation}
                    onChange={(e) =>
                      setFormData({ ...formData, relation: e.target.value })
                    }
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
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Birth Time</label>
                  <input
                    type="time"
                    value={formData.birthTime}
                    onChange={(e) =>
                      setFormData({ ...formData, birthTime: e.target.value })
                    }
                    disabled={formData.unknownBirthTime}
                  />
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.unknownBirthTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unknownBirthTime: e.target.checked,
                        })
                      }
                    />
                    Don't know the exact time of birth
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label>Place of Birth</label>
                  <LocationSearch
                    value={formData.birthPlace}
                    onChange={(e) =>
                      setFormData({ ...formData, birthPlace: e.target.value })
                    }
                    onPlaceSelect={(place) =>
                      setFormData({
                        ...formData,
                        birthPlace: place.address,
                        latitude: place.lat,
                        longitude: place.lng,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isCreating}
                >
                  {isCreating ? "Adding..." : "Add Profile"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowEditProfile(false)}
        >
          <div
            className={styles.sideSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHandle}></div>

            <div className={styles.sheetContent}>
              <button
                className={styles.closeBtn}
                onClick={() => setShowEditProfile(false)}
              >
                ×
              </button>
              <h2 className={styles.sheetTitle}>Edit Profile</h2>

              <form
                onSubmit={handleSubmitEditProfile}
                className={styles.profileForm}
              >
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder="Enter here"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Identity</label>
                  <div className={styles.identityButtons}>
                    <button
                      type="button"
                      className={
                        editFormData.identity === "Male" ? styles.active : ""
                      }
                      onClick={() =>
                        setEditFormData({ ...editFormData, identity: "Male" })
                      }
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      className={
                        editFormData.identity === "Female" ? styles.active : ""
                      }
                      onClick={() =>
                        setEditFormData({ ...editFormData, identity: "Female" })
                      }
                    >
                      Female
                    </button>
                    <button
                      type="button"
                      className={
                        editFormData.identity === "Others" ? styles.active : ""
                      }
                      onClick={() =>
                        setEditFormData({ ...editFormData, identity: "Others" })
                      }
                    >
                      Others
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Relation</label>
                  <select
                    value={editFormData.relation}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        relation: e.target.value,
                      })
                    }
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
                    value={editFormData.birthDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        birthDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Birth Time</label>
                  <input
                    type="time"
                    value={editFormData.birthTime}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        birthTime: e.target.value,
                      })
                    }
                    disabled={editFormData.unknownBirthTime}
                  />
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editFormData.unknownBirthTime}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          unknownBirthTime: e.target.checked,
                        })
                      }
                    />
                    Don't know the exact time of birth
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label>Place of Birth</label>
                  <LocationSearch
                    value={editFormData.birthPlace}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        birthPlace: e.target.value,
                      })
                    }
                    onPlaceSelect={(place) =>
                      setEditFormData({
                        ...editFormData,
                        birthPlace: place.address,
                        latitude: place.lat,
                        longitude: place.lng,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isCreating}
                >
                  {isCreating ? "Updating..." : "Edit Profile"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchMaking;
