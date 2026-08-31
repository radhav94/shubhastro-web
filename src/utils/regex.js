export const mobileRegex = /^([6-9]{1})([0-9]{9})$/;
export const emailRegex = /[A-Za-z0-9]+@[A-Za-z0-9]+\.[A-Za-z]{2,}/;

/*
  Person names.

  Every name field on the site used to validate with /^[A-Za-z\s]+$/, which
  accepts only unaccented Latin letters and spaces. That rejects, with no way
  around it:

    - any non-Latin script — Devanagari, Tamil, Bengali, Arabic/Persian, etc.
      A visitor whose name is written in their own script simply cannot submit
      the form, and the only feedback is "Name can only contain letters and
      spaces", which reads as nonsense because they *did* type letters.
    - initials and abbreviations: "R. K. Sharma", "St. John"
    - apostrophes: "D'Souza", "O'Brien" (both the ASCII ' and the typographic ’
      that iOS/Android keyboards insert automatically)
    - hyphenated names: "Anne-Marie", "Al-Hassan"

  This was showing up as repeated submissions of the kundli / guest-details
  forms: the CTA appears to do nothing useful, so it gets tapped again.

  \p{L} covers letters in every script and \p{M} the combining marks that
  scripts like Devanagari and Arabic need. Requiring the first character to be
  a letter still rejects input that is only punctuation.

  That "first character" requirement was anchored to position 0
  (`^[\p{L}\p{M}]...`), which silently excludes names that legitimately start
  with one of the punctuation marks the error message advertises as allowed —
  "O'Brien" typed apostrophe-first as "'Brien" while backspacing, "-Sharma",
  or ".D'Souza". The error message promises ". ' -" are usable characters, but
  the regex only accepted them from the second character onward, so the field
  rejected input the message said was fine. The lookahead below still requires
  at least one letter somewhere (rejecting pure punctuation like "---" or
  "..."), without pinning it to a specific position.
*/
export const personNameRegex = /^(?=.*[\p{L}\p{M}])[\p{L}\p{M}\s'’.-]+$/u;

export const PERSON_NAME_ERROR =
  "Please enter a valid name (letters, spaces, and . ' - only)";

/*
  Place names for postal addresses (city / state). Same problem as above, plus
  these legitimately contain characters a name does not: "Jammu & Kashmir",
  "Dadra and Nagar Haveli (UT)", "Y.S.R. Kadapa". The old letters-only rule
  made those addresses unsaveable.
*/
export const placeNameRegex = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.,&()/-]*$/u;

/*
  The complement of `personNameRegex`'s character class, for *stripping* rather
  than testing. Use this when filtering keystrokes in a name-ish field.

  The distinction matters: the astrologer search used to test the whole value and
  `return` on any disallowed character, which threw away the entire input instead
  of the offending character. Because the field was controlled, the keystroke
  simply never appeared — the search box looked broken, with nothing said. Strip
  what cannot be used and keep the rest, so typing always visibly does something.
*/
export const nonNameCharsGlobal = /[^\p{L}\p{M}\s'’.-]/gu;
