import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { PrimaryButton, PrimaryText } from "../../../../component";

import { IoMdClose } from "react-icons/io";

import { getWidth } from "../../../../utils/theme";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";

const RechargeAlertModel = ({
  isOpen,
  onClose,
  handleSubmit,
  astrologer = "Astrologer",
}) => {
  const modalWidth = `${getWidth() * 0.44}px`;

  return (
    <Modal modalOpen={isOpen} width={modalWidth}>
      <div className=" p-4">
        <div className="flex justify-end">
          <IoMdClose
            size={22}
            onClick={() => onClose(false)}
            className="cursor-pointer"
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          {/* <PrimaryText isExtraBold size_20 isCenter>
            Insufficient wallet balance
          </PrimaryText> */}
          <PrimaryText isCenter className=" pt-4">
            Minimum balance of 5 minutes (₹ 135) is required to start chat with
            {` ${getAstrologerDisplayName(astrologer) || "Astrologer"}`}.
          </PrimaryText>
          <PrimaryButton
            className=" mt-2"
            title="Reacharge NOW!"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </Modal>
  );
};

export default RechargeAlertModel;
