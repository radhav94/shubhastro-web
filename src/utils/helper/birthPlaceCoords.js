/*
  Shared birth-place coordinate rules for the calculator forms.

  Every one of these forms sends lat/lng to the astrology APIs, and every one of
  them only ever receives coordinates from LocationSearch's `onPlaceSelect`.
  Two gaps followed from that, both visible in Clarity session 1jnpm7q
  (Facebook, 01:15 AM Sep 1) which ends on "submitting forms twice" at 04:49 on
  the Sade Sati form:

    1. Typing over an already-picked place left the previous coordinates in
       state. Pick "Mumbai", edit the text to "Pune", submit -> the chart was
       computed from Mumbai's coordinates and labelled Pune. Silently wrong; the
       form submitted happily, which is why a visitor would submit again.
    2. handleSubmit only checked the place *text*, never lat/lng, so typing a
       city and never picking a suggestion submitted with lat: null.

  AddProfileModal already carries both fixes (its comment records the same
  Mumbai/Pune case). These helpers keep the rule single-sourced for the plain
  useState forms that share the { place, lat, lng } shape.
*/

// Same wording as AddProfileModal's schema test, so the instruction a visitor
// reads is identical wherever they hit it.
export const PLACE_NOT_SELECTED_ERROR =
  "Please select a valid location from the dropdown";

export const PLACE_REQUIRED_ERROR = "Place of birth is required";

/**
 * Validates a birth-place field that must carry coordinates.
 *
 * @param {string} place Typed/selected place text.
 * @param {number|null} lat
 * @param {number|null} lng
 * @returns {string} Error text to render under the field, or "" when valid.
 */
export const validateBirthPlace = (place, lat, lng) => {
  if (!place) return PLACE_REQUIRED_ERROR;
  if (!lat || !lng) return PLACE_NOT_SELECTED_ERROR;
  return "";
};

/**
 * State patch for "the visitor typed in the place field".
 *
 * Spread over the previous form state: keeps the new text and drops any
 * coordinates carried over from an earlier selection.
 *
 * @param {string} value Current input text.
 * @param {{ placeKey?: string, latKey?: string, lngKey?: string }} [keys]
 */
export const clearedPlaceCoords = (
  value,
  { placeKey = "place", latKey = "lat", lngKey = "lng" } = {}
) => ({
  [placeKey]: value,
  [latKey]: null,
  [lngKey]: null,
});
