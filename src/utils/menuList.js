export const MENU_LIST = [
  { title: "Home", path: "/" },

  {
    title: "Horoscope",
    children: [
      { title: "Daily Horoscope", path: "/horoscopes/daily-horoscope" },
      { title: "Monthly Horoscope", path: "/horoscopes/monthly-horoscope" },
    ],
  },

  {
    title: "Panchang",
    path: "/panchang",
    children: [
      {
        title: "Today's Panchang",
        path: "/panchang/today-panchang",
      },
    ],
  },
  { title: "Kundli", path: "/kundli" },
  { title: "Sadesati", path: "/sadesati" },
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
];
