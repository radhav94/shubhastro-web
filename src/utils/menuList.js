export const MENU_LIST = [
  { title: "Home", path: "/" },

  {
    title: "Horoscope",
    children: [
      { title: "Daily Horoscope", path: "/horoscopes/daily-horoscope" },
      { title: "Monthly Horoscope", path: "/horoscopes/weekly-horoscope" },
      { title: "Monthly Horoscope", path: "/horoscopes/yearly-horoscope" },
    ],
  },

  {
    title: "Panchang",
    path: "/panchang",
  },
  { title: "Kundli", path: "/kundli" },
  // { title: "Sadesati", path: "/sadesati" },
  { title: "Match Making", path: "/matchmaking" },
  { title: "Numerology", path: "/numerology" },
  {
    title: "Tarot",
    path: "/tarot",
    children: [
      {
        title: "Shuffle Tarot",
        path: "/tarot",
      },
      {
        title: "Yes/No Tarot",
        path: "/tarot/yes-no-tarot",
      },
      {
        title: "Daily Tarot",
        path: "/tarot/daily-tarot",
      },
    ],
  },
  {
    title: "Best Astrologers",
    children: [
      { title: "Vedic Astrologers", path: "/astro/vedic" },
      { title: "Tarot Experts", path: "/astro/tarot" },
    ],
  },
  { title: "Chat with Astrologer", path: "/talk-to-astrologers" },
  { title: "Talk to Astrologer", path: "/talk-to-astrologers" },
  { title: "Astromall", path: "/shop" },
  { title: "Live", path: "/livestream" },
  // { title: "Shubhtalk Store", path: "/store" },
  { title: "Blogs", path: "/blog" },
  { title: "Recharge", path: "/callingpack" },
];
