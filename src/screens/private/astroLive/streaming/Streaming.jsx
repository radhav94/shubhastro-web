import { IoMdClose } from "react-icons/io";
import styles from "./Streaming.module.scss";
import { PrimaryButton, PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";
import { AppImages } from "../../../../utils/appImages";
import { useLocation, useNavigate } from "react-router-dom";

const Streaming = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = location.state || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "Chirag",
      text: "Joined Yogi live...",
      time: "10:00 AM",
      avatar:
        "https://images.astroyogi.com/english/astrologer/profileimage/tarot-satvika-7405159392822997.jpg",
    },
    {
      sender: "Sanket",
      text: "Joined Yogi live...",
      time: "10:01 AM",
      avatar:
        "https://images.astroyogi.com/english/astrologer/profileimage/tarot-dharra-7690941669104289.jpg",
    },
    {
      sender: "Rohan",
      text: "Joined Yogi live...",
      time: "10:02 AM",
      avatar:
        "https://images.astroyogi.com/english/astrologer/profileimage/astro-manpreet-7707605892123109.jpg",
    },
    {
      sender: "Priya",
      text: "Hello everyone!",
      time: "10:03 AM",
      avatar:
        "https://images.astroyogi.com/english/astrologer/profileimage/astro-kautilya-7755968999436093.jpg",
    },
    {
      sender: "Amit",
      text: "How’s everyone doing?",
      time: "10:04 AM",
      avatar:
        "https://images.astroyogi.com/english/astrologer/profileimage/jyotish-aditya-7011732248477751.jpg",
    },
    {
      sender: "Sneha",
      text: "Nice to join here.",
      time: "10:05 AM",
      avatar:
        "https://images.astroyogi.com/english/astrologer/profileimage/tarot-shubh-16511220682.jpg",
    },
    {
      sender: "Rohit",
      text: "Excited for this session.",
      time: "10:06 AM",
      avatar:
        "https://images.astroyogi.com/english/astrologer/profileimage/shaivya-garhwal-6955857039802875.jpg",
    },
    {
      sender: "Neha",
      text: "Good morning!",
      time: "10:07 AM",
      avatar:
        "https://images.astroyogi.com/english/astrologer/profileimage/tarot-sonakshi-7285101791259835.jpg",
    },
    {
      sender: "Sanket",
      text: "Joined Yogi live...",
      time: "10:08 AM",
      avatar:
        "https://images.astroyogi.com/english/astrologer/profileimage/tarot-suma-7145089257114988.jpg",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const chatBodyRef = useRef(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages([
      ...messages,
      {
        sender: "You",
        text: inputValue,
        time,
        avatar:
          "https://images.astroyogi.com/english/astrologer/profileimage/astro-manpreet-7707605892123109.jpg",
      },
    ]);
    setInputValue("");
  };

  const onClose = () => {
    navigate(-1);
  };

  // Auto-scroll chat body
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.liveSession}>
      {/* Left Video Section */}
      <div className={styles.videoSection}>
        <div className={styles.videoHeader}>
          <PrimaryButton
            IconComponent={MdOutlineRemoveRedEye}
            title="820"
            buttonStyles={{ padding: "4px" }}
            fontSize={12}
            textColor={appColors.white}
            bgColor={appColors.tri}
          />
          <PrimaryButton
            IconComponent={BsThreeDotsVertical}
            buttonStyles={{ padding: "4px" }}
            fontSize={12}
            textColor={appColors.white}
            bgColor={appColors.tri}
            onClick={toggleMenu}
          />
          {menuOpen && (
            <div className={styles.dropdownMenu}>
              <PrimaryText size_14 isWhite className={styles.dropdownItem}>
                Voice Only
              </PrimaryText>
              <PrimaryText size_14 isWhite className={styles.dropdownItem}>
                Report
              </PrimaryText>
              <PrimaryText size_14 isWhite className={styles.dropdownItem}>
                Exit Yogi Live
              </PrimaryText>
            </div>
          )}
        </div>

        <div className={styles.videoContent}>
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

          <div className={styles.callButton}>
            <PrimaryText isWhite size_12>
              Call Now
            </PrimaryText>
          </div>
        </div>
      </div>

      {/* Right Chat Section */}
      <div className={styles.chatSection}>
        <div className={styles.chatHeader}>
          <img
            src={`https://images.astroyogi.com/english/astrologer/profileimage/${data.ProfileImage}`}
            alt="Astrologer"
          />
          <div>
            <PrimaryText>
              {data?.FirstName} {data.LastName}
            </PrimaryText>
            <PrimaryText size_12 color={appColors.greyMedium} lines={1}>
              {data.AstroCategoryNameDltd}
            </PrimaryText>
            <PrimaryButton
              buttonStyles={{ padding: "4px" }}
              fontSize={12}
              title="+ follow"
              width={120}
            />
          </div>
          <div className={styles.closeBtn}>
            <PrimaryButton
              title="close"
              buttonStyles={{ padding: "4px" }}
              textColor={appColors.white}
              fontSize={14}
              bgColor={appColors.btn}
              onClick={onClose}
            />
          </div>
        </div>

        {/* Chat Messages */}
        <div className={styles.chatBody} ref={chatBodyRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={styles.chatMessage}>
              <img
                src={msg.avatar}
                alt={msg.sender}
                className={styles.chatProfileIcon}
              />
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  <PrimaryText size_12>{msg.sender}</PrimaryText>
                  <span className={styles.timestamp}>{msg.time}</span>
                </div>
                <PrimaryText size_12>{msg.text}</PrimaryText>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {inputValue && (
            <div className={styles.typingIndicator}>
              <PrimaryText size_10 color={appColors.greyDark}>
                Sanket Typing
              </PrimaryText>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className={styles.chatFooter}>
          <input
            type="text"
            placeholder="Say hi..."
            className={styles.chatInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <PrimaryButton title="Send" fontSize={14} onClick={handleSend} />
        </div>
      </div>
    </div>
  );
};

export default Streaming;
