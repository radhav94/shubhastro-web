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
  // Bumped when submission is blocked on a birth place with no coordinates, to
  // bring the suggestion list back up. Consumers pass it to the birth-place
  // LocationSearch. See the guard in handleSubmitProfile.
  const [placeReopenSignal, setPlaceReopenSignal] = useState(0);

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
  // Always call hooks unconditionally (Rules of Hooks)
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

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
    timezone: 5.5,
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
    timezone: 5.5,
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
        timezone: selectedProfile.tzone ?? 5.5,
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
      timezone: profile.tzone ?? 5.5,
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
      hour: data.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
      min: data.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
      second: "00",
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: data.timezone ?? 5.5,
    };
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    if (!formData.birthPlace) {
      Toast.error("Please enter birth place");
      return;
    }

    /*
      This form had no coordinate check at all, unlike AddProfileModal. A place
      typed by hand (never picked from the dropdown) left latitude/longitude null,
      and buildKundliPayload below falls back to `lat: 0, lon: 0` — the Gulf of
      Guinea. The profile saved without complaint and every chart computed from it
      was wrong.
    */
    if (!formData.latitude || !formData.longitude) {
      Toast.error("Please select a valid location from the dropdown");
      /*
        Put the dropdown that message refers to back on screen.

        `reopenSignal` has existed in locationSearchVedic.jsx for a while and is
        wired into AddProfileModal and EditProfileModal, but this hook was left
        toasting alone. Coordinates are only ever set by picking a suggestion, so
        the message named a control that was not showing — and the caller cannot
        fix that by focusing the input, because `focus()` fires no event on an
        already-focused field, which is exactly the state someone is in when they
        tap submit straight after typing.

        Clarity dead clicks (session 1lkvwpx, Sep 4, Facebook in-app browser):
        five minutes on a birth-details form, 39 clicks, "Please select a valid
        loc" at 02:34 and again at 03:56, page refreshes at 03:14 and 04:28, then
        back to the homepage having never completed. Clarity truncates the text,
        but "select a valid" matches this string rather than GuestDetailsForm's
        "Please pick a location from the dropdown".
      */
      if (formData.birthPlace?.trim()) {
        setPlaceReopenSignal((n) => n + 1);
      }
      return;
    }

    // If user is not logged in, just set the profile locally without saving to backend
    if (!token) {
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
        timezone: 5.5,
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
        timezone: 5.5,
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
    if (!token) {
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
    /** Pass to the birth-place LocationSearch as `reopenSignal`. */
    placeReopenSignal,
    formatProfileDisplay,
  };
};
