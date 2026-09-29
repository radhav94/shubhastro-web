import { format12HourTime } from "../dateFormat/dateTime";

/*
 * The customer's opening message for a consultation: a greeting plus the birth
 * details the astrologer needs to start reading.
 *
 * Lives here, not in the chat hook that used to own it, because the same block is
 * required for audio and video sessions (see component/call/useVideoCallChat) —
 * those used to open with a bare "Hi <name>", so an astrologer taking a call had
 * to ask for name/DOB/TOB/POB out loud while the clock ran.
 *
 * It is sent as an ordinary chat message rather than rendered as UI, which is
 * what makes it reach the astrologer's side and the chat history for free.
 */

// Month names for turning a profile's numeric `month` (1–12) into "September".
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// First word of the astrologer's display name, e.g. "Prathamesh M" -> "Prathamesh".
const firstWord = (value) => String(value || "").trim().split(/\s+/)[0] || "";

const capitalize = (value) => {
  const str = String(value || "").trim();
  return str ? str[0].toUpperCase() + str.slice(1) : "";
};

/** Format a profile DOB as "16-September-1993". `month` is 1–12. */
export const formatProfileDob = (profile) => {
  const day = Number(profile?.day);
  const month = Number(profile?.month);
  const year = Number(profile?.year);
  if (!day || !month || !year || month < 1 || month > 12) return "";
  return `${day}-${MONTH_NAMES[month - 1]}-${year}`;
};

/*
  Build the customer's intro message, e.g.

    Hi Ravi,
    Below are my details:
    Name: Prathamesh M
    Gender: Male
    DOB: 16-September-1993
    TOB: 10:44 PM
    POB: Mumbai, Maharashtra, India

  Only the lines the selected profile can actually fill are included; with no
  profile it falls back to the plain "Hi <astrologer>" greeting so the session
  never opens with an empty details block.

  Field names are the kundli profile's own: `min` (not minute), `place` (not
  birthPlace), `hour` in 24h.

  @param {string} astrologerName
  @param {Object|null} profile - kundli profile
  @returns {string}
*/
export const buildIntroMessage = (astrologerName, profile) => {
  const greetName = firstWord(astrologerName);
  const greeting = `Hi ${greetName}`.trim();

  if (!profile || !profile.name) return greeting;

  const dob = formatProfileDob(profile);
  /*
    TOB is always included. Profiles store the birth time as numeric `hour` (24h)
    + `min`; when the exact time is unknown the profile forms save the system
    default 00:00, and we send that (as "12:00 AM") rather than omitting the line
    — TOB is a required field in this details block. `format12HourTime` derives
    the AM/PM from the 24-hour hour.
  */
  const tob = format12HourTime(
    Number.isFinite(Number(profile.hour)) ? profile.hour : 0,
    Number.isFinite(Number(profile.min)) ? profile.min : 0
  );

  const lines = [
    greeting.endsWith(",") ? greeting : `${greeting},`,
    "Below are my details:",
    profile.name && `Name: ${profile.name}`,
    profile.gender && `Gender: ${capitalize(profile.gender)}`,
    dob && `DOB: ${dob}`,
    `TOB: ${tob}`,
    profile.place && `POB: ${profile.place}`,
  ].filter(Boolean);

  return lines.join("\n");
};

export default buildIntroMessage;

/**
 * Resolve the kundli profile a session belongs to.
 *
 * Same order the chat screen uses, so an audio/video session opens with the same
 * person's details as a chat would: the header selection, then the profile the
 * call was started with (CallContext.lastSelectedKundli), then the profile behind
 * the id in use, then Self, then the first one.
 *
 * `name` is the test for the first two because both can hold a partial object
 * (an id-only selection), which cannot build the details block.
 *
 * @param {Object} options
 * @param {Object|null} options.selectedKundli
 * @param {Object|null} options.lastSelectedKundli
 * @param {Array|null} options.profiles
 * @param {string|null} options.kundliId
 * @returns {Object|null}
 */
export const resolveKundliProfile = ({ selectedKundli, lastSelectedKundli, profiles, kundliId }) => {
  if (selectedKundli?.name) return selectedKundli;
  if (lastSelectedKundli?.name) return lastSelectedKundli;
  if (!Array.isArray(profiles) || profiles.length === 0) return null;
  return (
    profiles.find((p) => p._id === kundliId) ||
    profiles.find((p) => p.relation?.toLowerCase() === "self") ||
    profiles[0] ||
    null
  );
};
