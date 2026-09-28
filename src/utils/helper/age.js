/*
 * Age rules for the person REGISTERING an account.
 *
 * Only the account holder's own date of birth is subject to this. Kundli
 * profiles for other people (children, family) are legitimately minors, so the
 * gate belongs on the self/registration DOB fields only — see the call sites of
 * isAdultDob() and the note in AddProfileModal.
 *
 * CLIENT-SIDE ONLY. Every registration path here posts to users/registerUser,
 * which can be called directly, so this stops the app from accepting an underage
 * signup — it does not stop one from happening. The same rule has to exist on
 * `dateOfBirth` in that endpoint for the requirement to actually hold.
 */
export const MIN_SIGNUP_AGE = 18;

export const UNDERAGE_ERROR = `You must be at least ${MIN_SIGNUP_AGE} years old to create an account.`;

/**
 * Whole years between a date of birth and today.
 *
 * Accepts a Date, a "YYYY-MM-DD" string, or anything `new Date()` parses.
 * Calendar-correct: someone whose birthday is tomorrow is still a year younger
 * today, which a days/365 approximation gets wrong for exactly the people this
 * rule is about.
 *
 * @param {Date|string} value
 * @returns {number|null} null when the value is missing or unparseable
 */
export const getAgeInYears = (value) => {
  if (!value) return null;

  const dob = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  // Birthday not reached yet this year.
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
};

/**
 * Whether this date of birth belongs to someone old enough to register.
 *
 * An unparseable or missing date returns TRUE: "is it a date at all" is a
 * different rule, already reported by each form's own required/format check, and
 * answering "you must be 18" to an empty field tells the user the wrong thing.
 *
 * @param {Date|string} value
 * @returns {boolean}
 */
export const isAdultDob = (value) => {
  const age = getAgeInYears(value);
  if (age === null) return true;
  return age >= MIN_SIGNUP_AGE;
};

/**
 * The latest date of birth that still qualifies — for `maxDate` on the self-DOB
 * pickers, so an underage date cannot be picked in the first place.
 *
 * @returns {Date}
 */
export const maxSignupDob = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_SIGNUP_AGE);
  return d;
};
