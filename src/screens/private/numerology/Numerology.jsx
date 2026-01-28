import { useState, useEffect } from "react";
import styles from "./Numerology.module.scss";
import PrimaryText from "../../../component/PrimaryText";
import { PATH } from "../../../utils/routes/Paths";
import { Link, useNavigate } from "react-router-dom";
import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import { useLazyGetNumerologyPredictionQuery } from "../../../services/appServices/numerologyServices";
import { Toast } from "../../../component";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import { getToken } from "../../../utils/token";

const NumerologyWeb = () => {
  const navigate = useNavigate();
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Get token
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  // Check authentication on mount
  useEffect(() => {
    const authToken = getToken();
    if (!authToken) {
      navigate("/login?skip=welcome");
    }
  }, [navigate]);

  // API Hooks
  const { data, isLoading, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();
  const [
    getNumerologyPrediction,
    { data: numerologyData, isLoading: isLoadingNumerology },
  ] = useLazyGetNumerologyPredictionQuery();

  // Get profiles from API
  const profiles = data?.data || [];
  const numerologyResponse = numerologyData?.response || null;
  console.log(profiles, "ashish");

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

  // Auto-select first profile on load
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, selectedProfile]);

  // Fetch numerology data when profile is selected
  useEffect(() => {
    if (selectedProfile) {
      const date = `${String(selectedProfile.day).padStart(2, "0")}/${String(selectedProfile.month).padStart(2, "0")}/${selectedProfile.year}`;
      const name = selectedProfile.name.replaceAll(" ", "");
      getNumerologyPrediction({
        date,
        name,
        lang: "en",
      });
    }
  }, [selectedProfile, getNumerologyPrediction]);

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setShowSelectProfile(false);
  };

  const handleAddProfile = () => {
    setShowSelectProfile(false);
    setShowAddProfile(true);
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

  // Helper function to format profile display
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

  return (
    <div className={styles.page}>
      {isLoading && <PrimaryLoader />}

      {/* Profile Header - Desktop Only */}
      <div className={styles.profileHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div
          className={styles.profileSelector}
          onClick={() => setShowSelectProfile(true)}
        >
          <span className={styles.selectLabel}>Select Profile</span>
          <span className={styles.profileName}>
            {selectedProfile ? selectedProfile.name : "Select Profile"}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                display: "inline-block",
                marginLeft: "4px",
                verticalAlign: "middle",
              }}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <button
          className={styles.editBtn}
          onClick={handleEditProfile}
          disabled={!selectedProfile}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Profile Bar */}
      <div className={styles.mobileProfileBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div
          className={styles.profileSelector}
          onClick={() => setShowSelectProfile(true)}
        >
          <span className={styles.selectLabel}>Select Profile</span>
          <span className={styles.profileName}>
            {selectedProfile ? selectedProfile.name : "Select Profile"}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                display: "inline-block",
                marginLeft: "4px",
                verticalAlign: "middle",
              }}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <button
          className={styles.editBtn}
          onClick={handleEditProfile}
          disabled={!selectedProfile}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* HERO SECTION */}
      <section className={styles.hero}>
        {/* <div className={styles.heroGlow}></div> */}

        <h1 className={styles.heroTitle}>
          Let the Numbers Guide You
        </h1>

        <p className={styles.heroSubtitle}>
          Based on your name and birth date, your numerology chart highlights
          key patterns shaping your life journey.
        </p>
      </section>

      {/* NUMEROLOGY CARDS */}
      {isLoadingNumerology ? (
        <div className={styles.loadingContainer}>
          <PrimaryLoader />
        </div>
      ) : numerologyResponse ? (
        <section className={styles.numerologySection}>
          {Object.values(numerologyResponse).map((item, index) => (
            <div key={index} className={styles.numerologyCard}>
              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>{item.title}</span>
                <h3 className={styles.cardTitle}>{item.category}</h3>
                <p className={styles.cardDescription}>{item.meaning}</p>
              </div>
              <div className={styles.cardNumber}>{item.number}</div>
            </div>
          ))}
        </section>
      ) : null}

      {/* TALK TO EXPERT BUTTON (Full Width) */}
      <section className={styles.fullWidthExpertSection}>
        <Link
          to={PATH.privateRoutes.Chat_With_ASTROLOGER.path}
          state={{
            selectedType: "Numerology",
          }}
        >
          <button className={styles.fullWidthExpertBtn}>
            Talk to a Numerology Expert
          </button>
        </Link>
      </section>

      {/* WHAT THIS MEANS FOR YOU */}
      <section className={styles.meansSection}>
        <h2 className={styles.meansTitle}>What this means for you</h2>

        <div className={styles.meansCarousel}>
          <div className={styles.meansCard}>
            <div className={styles.meansIcon}>{/* Icon placeholder */}</div>
            <p className={styles.meansText}>
              Strong potential for leadership-led growth
            </p>
          </div>

          <div className={styles.meansCard}>
            <div className={styles.meansIcon}>{/* Icon placeholder */}</div>
            <p className={styles.meansText}>
              Natural ability to inspire and motivate others
            </p>
          </div>

          <div className={styles.meansCard}>
            <div className={styles.meansIcon}>{/* Icon placeholder */}</div>
            <p className={styles.meansText}>
              Excellent communication and creative skills
            </p>
          </div>
        </div>
      </section>

      {/* TALK TO NUMEROLOGY EXPERT */}
      <section className={styles.expertSection}>
        <div className={styles.expertCard}>
          <div className={styles.expertContent}>
            <h3 className={styles.expertTitle}>Talk to a <br/> Numerology Expert</h3>
            <Link
              to={PATH.privateRoutes.Chat_With_ASTROLOGER.path}
              state={{
                selectedType: "Numerology",
              }}
            >
              <button className={styles.consultBtn}>Consult Now →</button>
            </Link>
          </div>
          <div className={styles.expertImage}>
            {/* <img src={talkToPik} alt="pik" className={styles.footer_logo} /> */}
          </div>
        </div>
      </section>

      {/* CURRENT CYCLE - PERSONAL YEAR NUMBER */}
      <section className={styles.cycleSection}>
        <div className={styles.cycleCard}>
          <span className={styles.cycleBadge}>Current Cycle</span>
          <h3 className={styles.cycleTitle}>Personal Year Number</h3>

          <div className={styles.cycleNumberBox}>
            <span className={styles.cycleNumber}>5</span>
          </div>

          <h4 className={styles.cycleSubtitle}>A Year of Change & Movement</h4>
          <p className={styles.cycleDescription}>
            This year encourages exploration, flexibility, and bold decisions.
            Avoid stagnation.
          </p>
        </div>
      </section>

      {/* GET DETAILED YEAR GUIDANCE */}
      <section className={styles.expertSection}>
        <div className={styles.expertCard}>
          <div className={styles.expertContent}>
            <h3 className={styles.expertTitle}>Get Detailed Year Guidance</h3>
            <Link
              to={PATH.privateRoutes.Chat_With_ASTROLOGER.path}
              state={{
                selectedType: "Numerology",
              }}
            >
              <button className={styles.consultBtn}>Consult Now →</button>
            </Link>
          </div>
          <div className={styles.expertImage}>
            {/* Placeholder for guidance image */}
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      {/* <section className={styles.features}>
        <div
          className={styles.card}
          onClick={() => navigate(PATH.privateRoutes.LIFE_PATH.path)}
          style={{ cursor: "pointer" }}
        >
          <div className={styles.cardIcon}>🔮</div>
          <PrimaryText size_20 isSemiBold>
            Life Path Insights
          </PrimaryText>
          <PrimaryText size_14 color="#6b6357">
            Discover your purpose, strengths, and spiritual alignment.
          </PrimaryText>
        </div>

        <div className={styles.card}
        // onClick={()=>navigate(PATH.privateRoutes.LIFE_PATH.path)}
        style={{cursor:"pointer"}}>
          <div className={styles.cardIcon}>✨</div>
          <PrimaryText size_20 isSemiBold>
            Compatibility Check
          </PrimaryText>
          <PrimaryText size_14 color="#6b6357">
            Reveal hidden energies between you and the people around you.
          </PrimaryText>
        </div>

          <div className={styles.card}
        onClick={()=>navigate(PATH.privateRoutes.LIFE_PATH.path)}
        style={{cursor:"pointer"}}>
          <div className={styles.cardIcon}>📜</div>
          <PrimaryText size_20 isSemiBold>
            Daily Energies
          </PrimaryText>
          <PrimaryText size_14 color="#6b6357">
            See what influence today’s numbers have on your journey.
          </PrimaryText>
        </div>
      </section> */}

      {/* <section className={styles.features}>
        <div
          className={styles.premiumCard}
          onClick={() => navigate(PATH.privateRoutes.LIFE_PATH.path)}
        >
          <div className={styles.cardIcon}>🔮</div>
          <PrimaryText size_20 isSemiBold>
            Life Path Insights
          </PrimaryText>
          <PrimaryText size_14 color="#6b6357">
            Discover your purpose, strengths, and spiritual alignment.
          </PrimaryText>
        </div>
      </section> */}

      {/* DEEP INSIGHT SECTION */}
      {/* <section className={styles.deepSection}>
        <PrimaryText size_28 isBold isCenter>
          What Makes Our System Unique?
        </PrimaryText>

        <PrimaryText size_16 color="#6b5e4d" className={styles.deepText}>
          A modern numerology engine built on ancient spiritual mathematics,
          refined with machine intelligence. Each reading uncovers deeper layers
          of your energetic identity.
        </PrimaryText>

        <div className={styles.deepGrid}>
          <div className={styles.deepItem}>
            <span>🧠</span>
            <PrimaryText size_16 isSemiBold>
              AI-Powered Insights
            </PrimaryText>
          </div>

          <div className={styles.deepItem}>
            <span>🔢</span>
            <PrimaryText size_16 isSemiBold>
              Sacred Mathematics
            </PrimaryText>
          </div>

          <div className={styles.deepItem}>
            <span>🌌</span>
            <PrimaryText size_16 isSemiBold>
              Soul Frequency Mapping
            </PrimaryText>
          </div>

          <div className={styles.deepItem}>
            <span>📈</span>
            <PrimaryText size_16 isSemiBold>
              Growth & Destiny Charts
            </PrimaryText>
          </div>
        </div>
      </section> */}

      {/* CTA SECTION */}
      {/* <section className={styles.cta}>
        <PrimaryText size_28 isBold isCenter>
          Begin Your Transformation
        </PrimaryText>
        <PrimaryText size_16 color="#6b5e4d" isCenter>
          Let numbers reveal what words cannot.
        </PrimaryText>

        <button className={styles.primaryBtnLarge}>Calculate My Numbers</button>
      </section> */}

      {/* Select Profile Modal */}
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
              <h2 className={styles.sheetTitle}>Select Profile</h2>

              <div className={styles.profileList}>
                {profiles.map((profile) => {
                  const formatted = formatProfileDisplay(profile);
                  return (
                    <div
                      key={profile._id}
                      className={styles.profileItem}
                      onClick={() => handleSelectProfile(profile)}
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
                        <p className={styles.profileLocation}>
                          {profile.place}
                        </p>
                      </div>
                      <div className={styles.radioBtn}>
                        {selectedProfile?._id === profile._id ? "●" : "○"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                className={styles.addProfileBtn}
                onClick={handleAddProfile}
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
export default NumerologyWeb;
