import React from "react";
import NestedTabs from "../../../../component/UI/tabs/nestedtabs/NestedTabs";
import { useSelector } from "react-redux";
import Planetary from "./generalWrapper/planetary/Planetary";
import Vimshottari from "../DashaContent/Vimshottari";
import Yoga from "./generalWrapper/yoga/Yoga";
import Rudraksha from "./remedies/rudraksha/Rudraksha";
import GemStones from "./remedies/gemstones/GemStones";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";

const Report = ({ data }) => {
  const userDetails = useSelector((state) => state?.form?.userDetails);
  const birthDetails = useSelector((state) => state?.form?.kundliPayload);

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

  ];

  return (
    <div>
      {/* 🔥 Show Name + DOB same as BasicContent UI */}
      <div className="flex mb-4">
        <PrimaryText isSemiBold size_20 color={appColors.tri}>
          {userDetails?.name?.charAt(0).toUpperCase() +
            userDetails?.name?.slice(1)}
        </PrimaryText>

        <div className="mx-2" />

        <PrimaryText isSemiBold size_20 color={appColors.tri}>
          ({String(birthDetails?.day).padStart(2, "0")} - {String(birthDetails?.month).padStart(2, "0")} - {birthDetails?.year})
        </PrimaryText>
      </div>

      <NestedTabs tabs={tabs} />
    </div>
  );
};

export default Report;
