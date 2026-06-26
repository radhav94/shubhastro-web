import { useEffect } from "react";
import { voiceSocket } from "../services/voiceSocketServices";
import { store } from "../store/store";
import { privateRequestNew } from "../services/appServices/privateRequestNew";

/**
 * Listens for `astrologer:status` socket event and updates
 * any cached astrologer data present on the current page.
 */
export default function useAstrologerStatusSocket() {
  useEffect(() => {
    const handleAstrologerStatus = (data) => {
      if (!data?.astrologerId) return;

      const { astrologerId, isActive, isActiveType, astrologer } = data;
      console.log("[AstrologerStatus] 📥 Received:", { astrologerId, isActive, isActiveType });

      const state = store.getState();
      const queries = state.privateRequestNew?.queries;
      if (!queries) return;

      let patchCount = 0;

      Object.entries(queries).forEach(([cacheKey, entry]) => {
        if (!entry || entry.status !== "fulfilled" || !entry.data) return;

        // Handle detail endpoints (getAstrologerById)
        if (cacheKey.startsWith("getAstrologerById(")) {
          const astro = entry.data?.data;
          if (astro?._id === astrologerId) {
            console.log("[AstrologerStatus] ✅ Patching:", cacheKey);
            store.dispatch(
              privateRequestNew.util.updateQueryData("getAstrologerById", entry.originalArgs, (draft) => {
                if (draft?.data) {
                  draft.data.isActive = isActive;
                  draft.data.isActiveType = isActiveType || [];
                  if (astrologer?.price) draft.data.price = astrologer.price;
                  if (astrologer?.rating !== undefined) draft.data.rating = astrologer.rating;
                }
              })
            );
            patchCount++;
          }
          return;
        }

        // Handle list endpoints
        const listEndpoints = ["getAstrologers", "filterAstrologers", "getRecommendedAstrologers", "getNewHomeDetails", "getHomeDetails"];
        const matchedEndpoint = listEndpoints.find((ep) => cacheKey.startsWith(ep + "("));
        if (!matchedEndpoint) return;

        // Find astrologer in any array within the response (handles multiple structures)
        const responseData = entry.data;
        if (!deepContainsAstrologer(responseData, astrologerId)) return;

        console.log("[AstrologerStatus] ✅ Patching:", cacheKey);
        patchCount++;

        store.dispatch(
          privateRequestNew.util.updateQueryData(matchedEndpoint, entry.originalArgs, (draft) => {
            deepPatchAstrologer(draft, astrologerId, { isActive, isActiveType, astrologer });
          })
        );
      });

      console.log("[AstrologerStatus] 🔧 Patched", patchCount, "entries");
      window.dispatchEvent(new CustomEvent("astrologer:status", { detail: data }));
    };

    voiceSocket.on("astrologer:status", handleAstrologerStatus);
    return () => voiceSocket.off("astrologer:status", handleAstrologerStatus);
  }, []);
}

/** Recursively checks if an astrologer _id exists anywhere in the object */
function deepContainsAstrologer(obj, astrologerId, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return false;
  if (obj._id === astrologerId) return true;
  if (Array.isArray(obj)) return obj.some((item) => deepContainsAstrologer(item, astrologerId, depth + 1));
  return Object.values(obj).some((val) => val && typeof val === "object" && deepContainsAstrologer(val, astrologerId, depth + 1));
}

/** Recursively patches astrologer fields in an Immer draft */
function deepPatchAstrologer(obj, astrologerId, { isActive, isActiveType, astrologer }, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return;
  if (obj._id === astrologerId) {
    obj.isActive = isActive;
    obj.isActiveType = isActiveType || [];
    if (astrologer?.price) obj.price = astrologer.price;
    if (astrologer?.rating !== undefined) obj.rating = astrologer.rating;
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => deepPatchAstrologer(item, astrologerId, { isActive, isActiveType, astrologer }, depth + 1));
    return;
  }
  Object.values(obj).forEach((val) => {
    if (val && typeof val === "object") deepPatchAstrologer(val, astrologerId, { isActive, isActiveType, astrologer }, depth + 1);
  });
}
