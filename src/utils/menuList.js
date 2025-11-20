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
  { title: "Kundli", path: "/kundli/:slug" },
  { title: "Sadesati", path: "/sadesati" },
  { title: "Match Making", path: "/matchmaking" },
];
