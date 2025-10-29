import React from "react";
import NestedTabs from "../../../../component/UI/tabs/nestedtabs/NestedTabs";
import General from "./general/general/General";
import Planetary from "./general/planetary/Planetary";
import Vimshottari from "./general/vimshottari/Vimshottari";
import Yoga from "./general/yoga/Yoga";
import Rudraksha from "./remedies/rudraksha/Rudraksha";
import Gemstones from "./remedies/gemstones/Gemstones";
import Manglik from "./dosha/manglik/Manglik";
import Kalsarpa from "./dosha/kalsarpa/Kalsarpa";
import Saresati from "./dosha/saresati/Saresati";


const FreeReport = () => {
  const tabs = [
    {
      label: "General",
      value: "general",
      children: [
        { label: "General", value: "generalInfo", component: General},
        { label: "Planetary", value: "planetary", component: Planetary },
        { label: "Vimshottari Dasha", value: "vimshottari", component: Vimshottari },
        { label: "Yoga", value: "yoga", component: Yoga },
      ],
    },
    {
      label: "Remedies",
      value: "remedies",
      children: [
        { label: "Rudraksha", value: "rudraksha", component: Rudraksha },
        { label: "Gemstones", value: "gemstones", component:Gemstones },
      ],
    },
    {
      label: "Dosha",
      value: "dosha",
      children: [
        { label: "Manglik", value: "manglik", component: () => Manglik },
        { label: "Kalsarpa", value: "kalsarpa", component: () => Kalsarpa },
        { label: "Sadesati", value: "sadesati", component: () => Saresati },
      ],
    },
  ];

  return <NestedTabs tabs={tabs} />;
};

export default FreeReport
