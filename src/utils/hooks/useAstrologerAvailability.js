import { useEffect, useState } from "react";
import { useGetBalanceMutation } from "../../redux/api/wallet/walletApi";

/**
 * Resolves whether an astrologer currently has chat / call / video enabled,
 * using the pre-session balance API (`wallets/preSessionBalanceCheck`).
 *
 * The response exposes explicit booleans (`isActiveForChat`, `isActiveForCall`,
 * `isActiveForVideo`) and an `isActiveType` array (e.g. ["chat", "audio"]).
 * We prefer the explicit booleans and fall back to the array.
 *
 * Used during an active session to hide the action button for any mode the
 * astrologer has disabled (e.g. hide "Video Call" when video is turned off).
 *
 * Defaults every mode to `true` until/unless the API definitively says false,
 * so buttons are never wrongly hidden on load or on a failed request.
 *
 * @param {string} astrologerId
 * @param {{ enabled?: boolean }} [options]
 * @returns {{ chat: boolean, call: boolean, video: boolean, loaded: boolean }}
 */
const useAstrologerAvailability = (astrologerId, { enabled = true } = {}) => {
  const [getBalance] = useGetBalanceMutation();
  const [availability, setAvailability] = useState({
    chat: true,
    call: true,
    video: true,
    loaded: false,
  });

  useEffect(() => {
    if (!enabled || !astrologerId) return;

    let cancelled = false;

    (async () => {
      try {
        const result = await getBalance({ astrologerId, type: "chat" });
        const data = result?.data?.data || {};

        const types = Array.isArray(data.isActiveType)
          ? data.isActiveType
          : Array.isArray(data?.availability?.isActiveType)
            ? data.availability.isActiveType
            : [];

        // Prefer the explicit boolean; otherwise derive from the type array.
        const resolve = (explicit, ...keys) =>
          typeof explicit === "boolean"
            ? explicit
            : keys.some((k) => types.includes(k));

        if (!cancelled) {
          setAvailability({
            chat: resolve(data.isActiveForChat, "chat"),
            call: resolve(data.isActiveForCall, "audio", "call"),
            video: resolve(data.isActiveForVideo, "video"),
            loaded: true,
          });
        }
      } catch {
        // On failure, don't hide anything — keep defaults (all true).
        if (!cancelled) {
          setAvailability((prev) => ({ ...prev, loaded: true }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [astrologerId, enabled, getBalance]);

  return availability;
};

export default useAstrologerAvailability;
