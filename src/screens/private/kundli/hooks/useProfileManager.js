import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} from "../../../../services/appServices/kundliServicesNew";
import { setForm } from "../../../../redux/kundliform/formSlice";
import { Toast } from "../../../../component";

export const useProfileManager = (dispatch) => {
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Get Redux form data
  const reduxUserDetails = useSelector((state) => state?.form?.userDetails);

  // Get token
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  // API Hooks - Only use mutations when user is logged in
  const {
    data,
    isLoading: profilesLoading,
    refetch,
  } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli, { isLoading: isCreating }] = token
    ? useCreateKundliMutation()
    : [null, { isLoading: false }];
  const [deleteKundli] = token ? useDeleteKundliMutation() : [null];

  const profiles = data?.data || [];

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

  // Auto-select profile if Redux has data and profiles are loaded
  useEffect(() => {
    if (reduxUserDetails && profiles.length > 0 && !selectedProfile) {
      // Try to find matching profile by name
      const matchingProfile = profiles.find(
        (profile) => profile.name === reduxUserDetails.name
      );
      
      if (matchingProfile) {
        setSelectedProfile(matchingProfile);
      }
    }
  }, [reduxUserDetails, profiles, selectedProfile]);

  // Dispatch selected profile to Redux when profile is selected
  useEffect(() => {
    if (selectedProfile && dispatch) {
      const months = [
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
      const meridiem = selectedProfile.hour >= 12 ? "PM" : "AM";
      const hour12 =
        selectedProfile.hour > 12
          ? selectedProfile.hour - 12
          : selectedProfile.hour === 0
            ? 12
            : selectedProfile.hour;

      const profilePayload = {
        name: selectedProfile.name,
        gender:
          selectedProfile.gender === "male"
            ? "Male"
            : selectedProfile.gender === "female"
              ? "Female"
              : "Others",
        day: String(selectedProfile.day),
        month: months[selectedProfile.month - 1],
        year: String(selectedProfile.year),
        hour: String(hour12),
        minute: String(selectedProfile.min),
        meridiem,
        birthPlace: selectedProfile.place,
        latitude: selectedProfile.lat,
        longitude: selectedProfile.lon,
      };

      dispatch(setForm(profilePayload));
    }
  }, [selectedProfile]);

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setShowSelectProfile(false);
  };

  const handleAddProfile = () => {
    setShowSelectProfile(false);
    setShowAddProfile(true);
  };

  const handleEditProfile = () => {
    if (selectedProfile) {
      setEditFormData({
        name: selectedProfile.name,
        identity:
          selectedProfile.gender === "male"
            ? "Male"
            : selectedProfile.gender === "female"
              ? "Female"
              : "Others",
        relation: "Self",
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

  const handleEditProfileFromListing = (profile) => {
    setEditFormData({
      name: profile.name,
      identity:
        profile.gender === "male"
          ? "Male"
          : profile.gender === "female"
            ? "Female"
            : "Others",
      relation: "Self",
      birthDate: `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`,
      birthTime: `${String(profile.hour).padStart(2, "0")}:${String(profile.min).padStart(2, "0")}`,
      birthPlace: profile.place,
      unknownBirthTime: false,
      latitude: profile.lat,
      longitude: profile.lon,
    });
    setSelectedProfile(profile);
    setShowSelectProfile(false);
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

    // If user is not logged in, just set the profile locally without saving to backend
    if (!token || !createKundli) {
      const payload = buildKundliPayload(formData);
      setSelectedProfile(payload);
      setShowAddProfile(false);

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
      return;
    }

    try {
      const payload = buildKundliPayload(formData);
      const result = await createKundli(payload).unwrap();
      Toast.success("Profile added successfully");
      setShowAddProfile(false);
      refetch();

      if (result?.data) {
        setSelectedProfile(result.data);
      }

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

    // If user is not logged in, just update the profile locally without saving to backend
    if (!token || !createKundli || !deleteKundli) {
      const payload = buildKundliPayload(editFormData);
      setSelectedProfile(payload);
      setShowEditProfile(false);
      return;
    }

    try {
      if (selectedProfile?._id) {
        await deleteKundli(selectedProfile._id).unwrap();
      }

      const payload = buildKundliPayload(editFormData);
      const result = await createKundli(payload).unwrap();

      Toast.success("Profile updated successfully");
      setShowEditProfile(false);
      refetch();

      if (result?.data) {
        setSelectedProfile(result.data);
      }
    } catch (err) {
      console.error(err);
      Toast.error(err?.data?.message || "Failed to update profile");
    }
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
      relation: "Self",
    };
  };

  return {
    selectedProfile,
    profiles,
    profilesLoading,
    isCreating,
    showSelectProfile,
    showAddProfile,
    showEditProfile,
    formData,
    editFormData,
    setShowSelectProfile,
    setShowAddProfile,
    setShowEditProfile,
    setFormData,
    setEditFormData,
    handleSelectProfile,
    handleAddProfile,
    handleEditProfile,
    handleEditProfileFromListing,
    handleSubmitProfile,
    handleSubmitEditProfile,
    formatProfileDisplay,
  };
};
