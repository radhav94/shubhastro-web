// Zodiac Sign Date Ranges
export const zodiacDateRanges = {
  aries: "March 21 - April 19",
  taurus: "April 20 - May 20",
  gemini: "May 21 - June 20",
  cancer: "June 21 - July 22",
  leo: "July 23 - August 22",
  virgo: "August 23 - September 22",
  libra: "September 23 - October 22",
  scorpio: "October 23 - November 21",
  sagittarius: "November 22 - December 21",
  capricorn: "December 22 - January 19",
  aquarius: "January 20 - February 18",
  pisces: "February 19 - March 20",
};

// Zodiac → Number Mapping (1–12)
export const signToNumber = {
  aries: 1,
  taurus: 2,
  gemini: 3,
  cancer: 4,
  leo: 5,
  virgo: 6,
  libra: 7,
  scorpio: 8,
  sagittarius: 9,
  capricorn: 10,
  aquarius: 11,
  pisces: 12,
};

export const Today = new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY
