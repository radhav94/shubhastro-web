import { useState, useCallback, useMemo } from "react";
import toast from "../../../component/toast";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";

export const useTalkToAstrologer = () => {
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState({
    details: false,
    recharge: false,
  });

  const onFollow = useCallback((id) => {
    console.log("Follow:", id);
  }, []);

  const handleSubmit = useCallback((values) => {
    try {
      localStorage.setItem("userDetails", JSON.stringify(values));
      setOpenModal((prev) => ({ ...prev, details: false }));
      toast.success("User Details Successfully Saved");
      setTimeout(() => {
        setOpenModal((prev) => ({ ...prev, recharge: true }));
      }, 500);
    } catch (e) {
      console.log(e);
    }
  }, []);

  const onProfile = useCallback((data) => {
    console.log("Profile:", data);
    return;
  }, []);

  const onChat = useCallback((data) => {
    const storedWallet = JSON.parse(localStorage.getItem("wallet"));
    if (storedWallet != null) {
      navigate(`/talk-to-astrologers/${data._id}`, { state: { data } });
      return;
    }
    setOpenModal((prev) => ({ ...prev, details: true }));
  }, [navigate]);

  const onRechargeNow = useCallback(() => {
    setOpenModal((prev) => ({ ...prev, recharge: false }));
    navigate(PATH.privateRoutes.RECHARGE.path);
  }, [navigate]);

  return useMemo(
    () => [
      onFollow,
      openModal,
      setOpenModal,
      onChat,
      onProfile,
      handleSubmit,
      onRechargeNow,
    ],
    [
      onFollow,
      openModal,
      onChat,
      onProfile,
      handleSubmit,
      onRechargeNow,
    ]
  );
};
