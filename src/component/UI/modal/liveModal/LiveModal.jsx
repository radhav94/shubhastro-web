import React from "react";
import Modal from "../Modal";
import { IoMdClose } from "react-icons/io";
import styles from "./LiveModal.module.scss";
import { getWidth } from "../../../../utils/theme";

const LiveModal = ({ isOpen, setModalOpen }) => {
  const modalWidth = `${getWidth() * 0.6}px`;
  return (
    // <Modal modalOpen={isOpen} width={modalWidth} className=" h-full ">
    <div className={styles.liveSession}>
      {/* Left Video Section */}
      <div className={styles.videoSection}>
        <div className={styles.videoHeader}>
          <img
            src="https://images.astroyogi.com/astroyogi2017/common/live_show/live_close.png"
            alt="Close"
          />
        </div>

        <div className={styles.videoContent}>
          <span style={{ color: "#fff" }}>Live Video Stream Area</span>

          <div className={styles.videoNavigation}>
            <div className="navBtn">
              <img
                src="https://images.astroyogi.com/astroyogi2017/common/left_light_gray.png"
                alt="Prev"
              />
            </div>
            <div className="navBtn">
              <img
                src="https://images.astroyogi.com/astroyogi2017/common/right_light_gray.png"
                alt="Next"
              />
            </div>
          </div>

          <div className={styles.videoControls}>
            <div className="controlBtn">
              <img
                src="https://images.astroyogi.com/astroyogi2017/common/live_show/plus_add.png"
                alt="Add"
              />
            </div>
            <div className="controlBtn">
              <img
                src="https://images.astroyogi.com/astroyogi2017/common/live_show/call_add.png"
                alt="Call"
              />
            </div>
          </div>

          <button className={styles.callButton}>
            Call Now <br /> ₹ 11/Min
          </button>
        </div>
      </div>

      {/* Right Chat Section */}
      <div className={styles.chatSection}>
        <div className={styles.chatHeader}>
          <img
            src="https://images.astroyogi.com/english/astrologer/profileimage/guest--7596942251332489.jpg"
            alt="Astrologer"
          />
          <div>
            <b>Tarot Niyati</b>
            <div>+ Follow</div>
            <div style={{ fontSize: "12px", color: "#555" }}>
              Tarot Reading, Love & Marriage Expert
            </div>
          </div>
        </div>

        <div className={styles.chatBody}>
          <div>
            <b>Chirag</b> Joined Yogi live
          </div>
          <div>
            <b>Preeti</b> Joined Yogi live
          </div>
        </div>

        <div className={styles.chatFooter}>
          <input
            type="text"
            placeholder="Say hi..."
            className={styles.chatInput}
          />
          <button className={styles.sendButton}>Send</button>
        </div>
      </div>
    </div>
    // </Modal>
  );
};

export default LiveModal;
