import React from "react";
import NestedTabs from "../../../../component/UI/tabs/nestedtabs/NestedTabs";
import General from "./generalWrapper/general/General";
import Planetary from "./generalWrapper/planetary/Planetary";
import Vimshottari from "./generalWrapper/vimshottari/Vimshottari";
import Yoga from "./generalWrapper/yoga/Yoga";
import FreeReport from "../FreeReportContent/FreeReportContent";
import Rudraksha from "./remedies/rudraksha/Rudraksha";
import GemStones from "./remedies/gemstones/GemStones";

const Report = ({ data }) => {

  const tabs = [
    {
      label: "General",
      value: "general",
      children: [
        // {
        //   label: "General Info",
        //   value: "generalInfo",
        //   component: () => <General />,
        // },
        {
          label: "Planetary",
          value: "planetary",
          component: () => <Planetary />,
        },
        {
          label: "Vimshottari",
          value: "vimshottari",
          component: () => <Vimshottari />,
        },
        {
          label: "Yoga",
          value: "yoga",
          component: () => <Yoga />,
        },
      ],
    },

    {
      label: "Remedies",
      value: "remedies",
      children: [
        {
          label: "Rudraksha",
          value: "rudraksha",
          component: () => <Rudraksha />,
        },
        {
          label: "Gem Stones",
          value: "gemstones",
          component: () => <GemStones />,
        },
      ],
    },

    {
      label: "Dosha",
      value: "dosha",
      component: () => <FreeReport />, 
    },
  ];



  return (
    <div>
      <NestedTabs tabs={tabs} />

    </div>
  );
};

export default Report;
