import React, { useEffect, useState } from "react";
import styles from "./GiftSection.module.scss";
import { IoGiftOutline } from "react-icons/io5";
import {
  useGetAllGiftsQuery,
  useSendGiftMutation,
} from "../../../redux/api/gift/giftApi";
import { useNavigate } from "react-router-dom";
import toast from "../../../component/toast";
import { useWalletBalance } from "../wallet/useWalletBalance";

const GiftSection = ({ astrologer }) => {
  const { data, isLoading } = useGetAllGiftsQuery();
  const [sendGift, { isLoading: isSending }] = useSendGiftMutation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [disableSend, setDisableSend] = useState(false);
  const gifts = data?.data || [];
  const { balance, refreshWallet } = useWalletBalance();

  const handleSend = async () => {
    if (!selected || !astrologer) return;

    try {
      await sendGift({
        giftId: selected?.ID,
        astrologerId: astrologer?.ID,
      }).unwrap();
      setSelected(null);
      refreshWallet();
      toast.success("Gift sent successfully");
    } catch (error) {
      console.error("Error sending gift:", error);
    }
  };

  const handleRecharge = () => navigate("/callingpack");

  useEffect(() => {
    if (selected && selected?.price > balance) {
      setDisableSend(true);
    } else setDisableSend(false);
  }, [selected]);

  if (isLoading) return <p>loading...</p>;

  return (
    <div className={styles.giftBox}>
      <div className={styles.headerRow}>
        <div className={styles.subHeader}>
          <IoGiftOutline size={18} />
          <h3>
            Send Gift to {astrologer?.firstName + " " + astrologer?.lastName}
          </h3>
        </div>
        <div className={styles.priceTag}> ₹ {balance}</div>
      </div>

      <div className={styles.giftGrid}>
        {gifts?.map((gift) => (
          <div
            key={gift?.ID}
            className={`${styles.giftItem} ${
              selected?.ID === gift?.ID ? styles.selected : ""
            }`}
            onClick={() => setSelected(gift)}
          >
            <div className={styles.emoji}>
              {" "}
              <img src={gift?.giftImg} />{" "}
            </div>
            <p className={styles.name}>{gift.giftName}</p>
            <p className={styles.amount}>₹ {gift?.price}</p>
          </div>
        ))}
      </div>

      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.rechargeBtn}
          onClick={handleRecharge}
        >
          Recharge
        </button>
        <button
          className={styles.sendBtn}
          disabled={!selected || disableSend || isSending}
          onClick={handleSend}
        >
          {isSending
            ? "Sending..."
            : `Send Gift ${selected ? `• ₹${selected?.price}` : ""}`}
        </button>
      </div>
    </div>
  );
};
export default GiftSection;
