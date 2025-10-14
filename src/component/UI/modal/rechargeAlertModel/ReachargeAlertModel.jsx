import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { PrimaryButton, PrimaryText } from "../../../../component";

import { IoMdClose } from "react-icons/io";

import { getWidth } from "../../../../utils/theme";

const RechargeAlertModel = ({ isOpen, onClose, handleSubmit }) => {
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
        <div className="  ">
          <PrimaryText isExtraBold size_20 isCenter>
            Insufficient wallet balance
          </PrimaryText>
          <PrimaryText isCenter className=" pt-4">
            Your wallet balance is ₹ 0.00 and required amount to consult with
            <br />
            Tarot Amrita is ₹ 25.00. Please recharge your wallet to consult.
          </PrimaryText>
          <PrimaryButton
            title="Reacharge NOW!"
            className=" mt-4"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </Modal>
  );
};

export default RechargeAlertModel;
