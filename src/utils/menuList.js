import { Home, Compass, Radio, UserRound, Store } from "lucide-react";
import { isShubhMallEnabled } from "./featureConfig";

export const MENU_LIST = [
  { title: "Home", path: "/" },

  {
    title: "Horoscope",
    children: [
      { title: "Daily Horoscope", path: "/daily-horoscope" },
      { title: "Monthly Horoscope", path: "/weekly-horoscope" },
      { title: "Monthly Horoscope", path: "/yearly-horoscope" },
    ],
  },

  {
    title: "Panchang",
    path: "/panchang",
  },
  { title: "Kundli", path: "/kundli" },
  // { title: "Sadesati", path: "/sadesati" },
  { title: "Match Making", path: "/match-making" },
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
  { title: "Chat with Astrologer", path: "/astrologers" },
  { title: "Talk to Astrologer", path: "/astrologers" },
  ...(isShubhMallEnabled() ? [{ title: "Shubhmall", path: "/shubh-mall" }] : []),
  { title: "Live", path: "/livestream" },
  // { title: "Shubhtalk Store", path: "/store" },
  { title: "Blogs", path: "/blog" },
  { title: "Recharge", path: "/recharge" },
];
// 🔹 Config-driven navigation (scalable)
  export const navItems = [
    {
      label: "Home",
      icon: Home,
      path: "/",
    },
    {
      label: "Explore",
      icon: Compass,
      path: "/explore",
    },
    {
      label: "Live",
      icon: Radio,
      path: "/live",
      isSpecial: true,
    },
    ...(isShubhMallEnabled()
      ? [
          {
            label: "ShubhMall",
            icon: Store,
            path: "/shubh-mall",
          },
        ]
      : []),
    {
      label: "Profile",
      icon: UserRound,
      path: "/profile",
      isProtected: true,
    },
  ];
