import React from "react";
import { appColors } from "../../../utils/theme";
import PrimaryText from "../../PrimaryText";
import { AppImages } from "../../../utils/appImages";

const WorkInProgressCard = () => {
  return (
    <div className="flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center  w-full">
        <PrimaryText size_24 color={appColors.pri}>
          Work in progress
        </PrimaryText>
        <PrimaryText color={appColors.tri}>
          Thanks for your patience!
        </PrimaryText>

        <img
          src={AppImages.Progress}
          alt="progress"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
};

export default WorkInProgressCard;
