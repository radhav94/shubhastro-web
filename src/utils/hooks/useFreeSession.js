import { useEffect, useState } from "react";
import { isFreeSessionEnabled } from "../featureConfig";
import { useGetUserProfileQuery } from "../../redux/api/user/userProfileApi";
import { getProfileId, extractFirstSessionFree } from "../../services/appServices/profileService";
import {
  FREE_SESSION_EVENT,
  readFreeSessionStatus,
} from "../auth/freeSessionStatus";

/**
 * Whether to present chat/call as free for this visitor.
 *
 * BOTH conditions are required, and the second one is strict:
 *
 * 1. VITE_FREE_SESSION_ENABLED — the offer is running in this environment.
 * 2. `isFirstSessionFree === true` for this user.
 *
 * A missing field is NOT eligible. Anything other than an explicit `true` — the
 * backend not sending the field, a profile that could not be read, a guest with
 * no profile at all — means no "Free" label and no popup. The flag alone is not
 * enough: it says the offer exists, not that THIS user still has it, and showing
 * "Free" to someone who is then charged is the failure worth avoiding.
 *
 * (An earlier version treated a missing field as "fall back to the flag" so the
 * offer would work before the backend shipped it. That is wrong for this
 * feature: it advertised a free session to everyone, including users who had
 * already used theirs.)
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
  const enabled = isFreeSessionEnabled();

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

  // Only when the offer is on, the user is signed in, and login did not already
  // answer it. RTK Query dedupes this across every card on screen.
  const { data } = useGetUserProfileQuery(profileId, {
    skip: !enabled || !profileId || cached !== null,
  });

  const eligible = cached !== null ? cached : extractFirstSessionFree(data);

  return enabled && eligible === true;
};

export default useFreeSession;
