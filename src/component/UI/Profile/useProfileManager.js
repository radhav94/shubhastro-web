import { useState } from "react";
import {
  useCreateKundliMutation,
  useDeleteKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import { Toast } from "../../index";

const useProfileManager = () => {
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

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
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase()
    );

  const handleCreateProfile = async (formData, existingProfiles = []) => {
    try {
      const payload = buildKundliPayload(formData);

      console.log("=== CREATE KUNDLI API CALL ===");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      // Check for duplicate
      if (isDuplicateKundli(payload, existingProfiles)) {
        console.log("❌ Duplicate detected");
        Toast.error("This profile already exists");
        throw new Error("Duplicate profile");
      }

      const result = await createKundli(payload).unwrap();
      console.log("✅ API Response:", result);
      Toast.success("Profile added successfully");

      return result?.data;
    } catch (err) {
      console.error("=== CREATE KUNDLI ERROR ===");
      console.error("Error:", err);

      const errorMessage =
        err?.data?.message || err?.message || "Failed to add profile";

      if (err.message !== "Duplicate profile") {
        Toast.error(errorMessage);
      }

      throw err;
    }
  };

  const handleDeleteProfile = async (profileId) => {
    try {
      console.log("=== DELETE KUNDLI ===");
      console.log("Deleting profile ID:", profileId);

      await deleteKundli(profileId).unwrap();
      console.log("✅ Profile deleted successfully");

      return true;
    } catch (err) {
      console.error("=== DELETE KUNDLI ERROR ===");
      console.error("Error:", err);

      const errorMessage =
        err?.data?.message || err?.message || "Failed to delete profile";

      Toast.error(errorMessage);
      throw err;
    }
  };

  return {
    handleCreateProfile,
    handleDeleteProfile,
    isCreating,
  };
};

export default useProfileManager;
