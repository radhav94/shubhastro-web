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
import {
  Toast,
  AddProfileModal,
  ProfileListingModal,
  DeleteConfirmationModal,
} from "../../../component";
import EditProfileModal from "../../../component/UI/Profile/EditProfileModal";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { ProfileManager } from "../../../component/UI/Profile";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import { DefaultImages } from "../../../utils/appImages";

const NumerologyWeb = () => {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();

  // ✅ Authentication check - redirect to login if not authenticated
  if (!requireAuth()) return null;
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [profileToEdit, setProfileToEdit] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Get token
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  // Get current user ID
  const currentUserId =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_id")
      : localStorage.getItem("shubhtalk_customer_id");

  // API Hooks
  const { data, isLoading, refetch, isFetching } = useGetAllKundlisQuery(
    undefined,
    {
      skip: !token,
    },
  );
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();
  const [
    getNumerologyPrediction,
    { data: numerologyData, isLoading: isLoadingNumerology },
  ] = useLazyGetNumerologyPredictionQuery();

  // Get profiles from API
  const profiles = data?.data || [];
  const numerologyResponse = numerologyData?.response || null;

  // Auto-select first profile on load - only after data is fetched
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile && !isFetching) {
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, selectedProfile, isFetching]);

  // Clear selected profile when user changes (on refresh after login)
  useEffect(() => {
    if (currentUserId && selectedProfile) {
      const profileBelongsToCurrentUser = profiles.some(
        (profile) => profile._id === selectedProfile._id,
      );

      if (!profileBelongsToCurrentUser) {
        setSelectedProfile(null);
      }
    }
  }, [currentUserId, profiles]);

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

  const handleDeleteProfile = (profileId) => {
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
  };

  const handleEditProfile = (profile) => {
    setProfileToEdit(profile);
    setShowSelectProfile(false);
    setShowEditProfile(true);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;

    try {
      await deleteKundli(profileToDelete).unwrap();
      Toast.success("Profile deleted successfully");

      // Clear selection if deleted profile was selected
      if (selectedProfile?._id === profileToDelete) {
        setSelectedProfile(null);
      }

      await refetch();
      setShowDeleteModal(false);
      setProfileToDelete(null);
    } catch (err) {
      console.error(err);
      Toast.error(err?.data?.message || "Failed to delete profile");
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  };

  const handleSubmitEditProfile = async (formData) => {
    try {
      if (!profileToEdit) return;

      // Delete old profile
      await deleteKundli(profileToEdit._id).unwrap();

      // Create new profile with updated data
      const payload = buildKundliPayload(formData);
      const result = await createKundli(payload).unwrap();

      Toast.success("Profile updated successfully");
      await refetch();

      // Update selection if edited profile was selected
      if (result?.data && selectedProfile?._id === profileToEdit._id) {
        setSelectedProfile(result.data);
      }

      setShowEditProfile(false);
      setProfileToEdit(null);
    } catch (err) {
      console.error(err);
      Toast.error(err?.data?.message || "Failed to update profile");
      throw err;
    }
  };

  const getEditInitialData = () => {
    if (!profileToEdit) return null;

    return {
      name: profileToEdit.name,
      identity:
        profileToEdit.gender === "male"
          ? "Male"
          : profileToEdit.gender === "female"
            ? "Female"
            : "Others",
      relation: "Self",
      birthDate: `${profileToEdit.year}-${String(profileToEdit.month).padStart(2, "0")}-${String(profileToEdit.day).padStart(2, "0")}`,
      birthTime: `${String(profileToEdit.hour).padStart(2, "0")}:${String(profileToEdit.min).padStart(2, "0")}`,
      birthPlace: profileToEdit.place,
      unknownBirthTime: false,
      latitude: profileToEdit.lat,
      longitude: profileToEdit.lon,
    };
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
      hour: data.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
      min: data.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
      second: "00",
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: 5.5,
    };
  };

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
        Math.abs(Number(k.lat) - Number(payload.lat)) < 0.0001 &&
        Math.abs(Number(k.lon) - Number(payload.lon)) < 0.0001 &&
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase(),
    );

  const handleSubmitProfile = async (formData) => {
    try {
      const payload = buildKundliPayload(formData);

      // Check for duplicate
      if (isDuplicateKundli(payload, profiles)) {
        Toast.error("This profile already exists");
        throw new Error("Duplicate profile");
      }

      const result = await createKundli(payload).unwrap();
      Toast.success("Profile added successfully");

      await refetch();

      // Auto-select the newly created profile
      if (result?.data) {
        setSelectedProfile(result.data);
      }

      setShowAddProfile(false);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err?.data?.message || err?.message || "Failed to add profile";
      Toast.error(errorMessage);
      throw err;
    }
  };

  return (
    <div className={styles.page}>
      {isLoading && <PrimaryLoader />}

      {/* Profile Header - Desktop Only */}
      <div className={styles.profileHeaderWrap}>
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
        </div>
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
      </div>

      {/* HERO SECTION */}
      <section className={styles.hero}>
        {/* <div className={styles.heroGlow}></div> */}

        <h1 className={styles.heroTitle}>Let the Numbers Guide You</h1>

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
      {/* <section className={styles.fullWidthExpertSection}>
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
      </section> */}

      {/* WHAT THIS MEANS FOR YOU */}
      {/* <section className={styles.meansSection}>
        <h2 className={styles.meansTitle}>What this means for you</h2>

        <div className={styles.meansCarousel}>
          <div className={styles.meansCard}>
            <div className={styles.meansIcon}> */}{/* Icon placeholder */}{/* </div>
            <p className={styles.meansText}>
              Strong potential for leadership-led growth
            </p>
          </div>

          <div className={styles.meansCard}>
            <div className={styles.meansIcon}> */}{/* Icon placeholder */}{/* </div>
            <p className={styles.meansText}>
              Natural ability to inspire and motivate others
            </p>
          </div>

          <div className={styles.meansCard}>
            <div className={styles.meansIcon}> */}{/* Icon placeholder */}{/* </div>
            <p className={styles.meansText}>
              Excellent communication and creative skills
            </p>
          </div>
        </div>
      </section> */}

      {/* TALK TO NUMEROLOGY EXPERT */}
      <section className={styles.expertSection}>
        <div className={styles.expertCard}>
          <div className={styles.expertContent}>
            <h3 className={styles.expertTitle}>
              Talk to a <br /> Numerology Expert
            </h3>
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
            <img src={DefaultImages.AstrologerNumerologyDefault} alt="pik" className={styles.footer_logo} />
          </div>
        </div>
      </section>

      {/* CURRENT CYCLE - PERSONAL YEAR NUMBER */}
      {/* <section className={styles.cycleSection}>
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
      </section> */}

      {/* GET DETAILED YEAR GUIDANCE */}
      {/* <section className={styles.expertSection}>
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
          <div className={styles.expertImage}> */}
            {/* Placeholder for guidance image */}
          {/* </div>
        </div>
      </section> */}

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

      
      {/* Profile Manager - Handles all profile operations */}
      <ProfileManager
        isOpen={showSelectProfile}
        onClose={() => setShowSelectProfile(false)}
        onProfileSelect={handleSelectProfile}
        selectedProfileId={selectedProfile?._id}
        title="Select Profile"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Profile Listing Modal */}
      {/* <ProfileListingModal
        isOpen={showSelectProfile}
        onClose={() => setShowSelectProfile(false)}
        profiles={profiles}
        selectedProfileId={selectedProfile?._id}
        onSelectProfile={handleSelectProfile}
        onDeleteProfile={handleDeleteProfile}
        onEditProfile={handleEditProfile}
        onAddProfile={handleAddProfile}
        title="Select Profile"
        showAddButton={true}
        showDeleteButton={true}
        showEditButton={true}
      /> */}

      {/* Add Profile Modal */}
      {/* <AddProfileModal
        isOpen={showAddProfile}
        onClose={() => setShowAddProfile(false)}
        onSubmit={handleSubmitProfile}
        isLoading={isCreating}
        title="Add Profile"
      /> */}

      {/* Delete Confirmation Modal */}
      {/* {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Profile"
          message="Are you sure you want to delete this profile? This action cannot be undone."
          onCancel={() => {
            setShowDeleteModal(false);
            setProfileToDelete(null);
          }}
          onConfirm={confirmDeleteProfile}
        />
      )} */}

      {/* Edit Profile Modal */}
      {/* <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => {
          setShowEditProfile(false);
          setProfileToEdit(null);
        }}
        onSubmit={handleSubmitEditProfile}
        isLoading={isCreating}
        title="Edit Profile"
        initialData={getEditInitialData()}
      /> */}
    </div>
  );
};
export default NumerologyWeb;
