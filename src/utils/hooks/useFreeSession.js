import { useEffect, useState } from "react";
import { useGetUserProfileQuery } from "../../redux/api/user/userProfileApi";
import { getProfileId, extractFirstSessionFree } from "../../services/appServices/profileService";
import {
  FREE_SESSION_EVENT,
  readFreeSessionStatus,
} from "../auth/freeSessionStatus";

/**
 * Whether to present chat/call as free for this visitor.
 *
 * Driven purely by the API now — the VITE_FREE_SESSION_ENABLED env flag has been
 * removed as a gate. Eligibility is `isFirstSessionFree === true` for this user,
 * as reported by the backend.
 *
 * A missing field is NOT eligible. Anything other than an explicit `true` — the
 * backend not sending the field, a profile that could not be read, a guest with
 * no profile at all — means no "Free" label and no popup. Showing "Free" to
 * someone who is then charged is the failure worth avoiding.
 *
 * The value is resolved AT LOGIN (utils/auth/freeSessionStatus: from the login
 * payload, else GET /api/Profile/:id) and cached, so the common case costs no
 * request here — the astrologer cards render ten to twenty at a time and must not
 * each ask. The query below only covers a session that predates that resolution,
 * i.e. someone already logged in when this shipped.
 *
 * Whether the session is ACTUALLY free is still settled server-side at connect
 * time; this only decides what the UI promises.
 *
 * @returns {boolean}
 */
export const useFreeSession = () => {
  /*
    localStorage is not reactive, and the login-time resolution can finish a
    moment AFTER the cards have rendered (it may have to call the profile
    endpoint). Without listening, a user who just logged in would keep the
    pre-login labels until a navigation. freeSessionStatus fires this event on
    every write.
  */
  const [cached, setCached] = useState(() => readFreeSessionStatus());
  useEffect(() => {
    const sync = () => setCached(readFreeSessionStatus());
    window.addEventListener(FREE_SESSION_EVENT, sync);
    window.addEventListener("auth-change", sync);
    return () => {
      window.removeEventListener(FREE_SESSION_EVENT, sync);
      window.removeEventListener("auth-change", sync);
    };
  }, []);

  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("shubhtalk_customer_token");
  const profileId = hasToken ? getProfileId() : null;

  // Only when the user is signed in and login did not already answer it.
  // RTK Query dedupes this across every card on screen.
  const { data } = useGetUserProfileQuery(profileId, {
    skip: !profileId || cached !== null,
  });

  const eligible = cached !== null ? cached : extractFirstSessionFree(data);

  return eligible === true;
};

export default useFreeSession;
