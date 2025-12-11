import React, { useEffect, useState } from "react";
import styles from "./GiftSection.module.scss";
import { IoGiftOutline } from "react-icons/io5";
import ganpati from "./ganpati.png";
import { useGetAllGiftsQuery, useSendGiftMutation } from "../../../redux/api/gift/giftApi";
import { useNavigate } from "react-router-dom";
import toast from "../../../component/toast";

const GiftSection = ({astrologerId }) => {
  const { data, isLoading } = useGetAllGiftsQuery();
  const [sendGift, {isLoading: isSending}] = useSendGiftMutation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [disableSend, setDisableSend] = useState(false);
  const gifts = data?.data || [];
  const walletBalance = 154;

  const handleSend = async() => {
    if (!selected || !astrologerId) return;

    try {
      await sendGift({giftId: selected?.ID, astrologerId}).unwrap();
      setSelected(null);
      toast.success("Gift sent successfully")
    } catch (error) {
      console.error("Error sending gift:", error);
    }
  };

  const handleRecharge = () => navigate("/callingpack");

  useEffect(() => {
    if (selected && selected?.price > walletBalance) {
      setDisableSend(true);
    } else setDisableSend(false);
  }, [selected]);

  if (isLoading) return <p>loading...</p>;

  return (
    <div className={styles.giftBox}>
      <div className={styles.headerRow}>
        <div className={styles.subHeader}>
          <IoGiftOutline size={18} />
          <h3>Send Gift to Harjeet</h3>
        </div>
        <div className={styles.priceTag}> ₹ {walletBalance}</div>
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
              <img src={ganpati} />{" "}
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
          {isSending ? 'Sending...' : `Send Gift ${selected ? `• ₹${selected?.price}` : ''}`}
        </button>
      </div>
    </div>
  );
};
export default GiftSection;
