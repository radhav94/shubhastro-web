import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Plus, Minus } from "lucide-react";
import styles from "./FAQ.module.scss";

const FAQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("Account and Profile");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const fromTab = location.state?.fromTab;
  const isWebview = new URLSearchParams(location.search).get("type") === "webview";

  const categories = [
    { id: 1, label: "Account and Profile" },
    { id: 2, label: "Chat and Call with Astrologer" },
    { id: 3, label: "AI Astrology Features" },
    { id: 4, label: "Kundli, Horoscope and Matchmaking" },
    { id: 5, label: "Wallet and Payments" },
    { id: 6, label: "Refunds and Failed Transactions" },
    { id: 7, label: "Offers and Discounts" },
    { id: 8, label: "Privacy and User Safety" },
    { id: 9, label: "Technical Support" },
  ];

  const faqData = {
    "Account and Profile": [
      {
        id: 1,
        question: "How can I create an account on ShubhAstro.ai?",
        answer: "You can create an account using your mobile number, email ID, or available login options.",
      },
      {
        id: 2,
        question: "Why do I need to share my birth details?",
        answer: "Your birth date, birth time, and birth place help provide more accurate astrology predictions.",
      },
      {
        id: 3,
        question: "Can I update my profile details later?",
        answer: "Yes, you can update your profile details from your account section.",
      },
      {
        id: 4,
        question: "Is my personal information safe?",
        answer: "Yes, your personal details are kept secure and used only to provide astrology-related services.",
      },
      {
        id: 5,
        question: "Can I delete my account?",
        answer: "Yes, you can request account deletion as per ShubhAstro.ai's policy.",
      },
    ],
    "Chat and Call with Astrologer": [
      {
        id: 1,
        question: "How can I connect with an astrologer?",
        answer: "You can select an astrologer and connect through chat or call based on availability.",
      },
      {
        id: 2,
        question: "Can I choose my preferred astrologer?",
        answer: "Yes, you can choose an astrologer based on expertise, language, rating, experience, and availability.",
      },
      {
        id: 3,
        question: "What happens if the astrologer is busy?",
        answer: "You can wait for availability or choose another available astrologer.",
      },
      {
        id: 4,
        question: "Can I ask personal questions during consultation?",
        answer: "Yes, you can ask questions related to love, marriage, career, finance, health, family, education, and more.",
      },
      {
        id: 5,
        question: "Are chat and call consultations private?",
        answer: "Yes, your consultation is kept private and handled with confidentiality.",
      },
    ],
    "AI Astrology Features": [
      {
        id: 1,
        question: "What is AI astrology on ShubhAstro.ai?",
        answer: "AI astrology uses technology and astrology logic to provide quick guidance based on your details.",
      },
      {
        id: 2,
        question: "Can I get instant astrology answers?",
        answer: "Yes, AI-powered features may help you get quick astrology-based answers.",
      },
      {
        id: 3,
        question: "Is AI astrology different from astrologer consultation?",
        answer: "Yes, AI astrology gives instant automated guidance, while astrologer consultation gives personalized human guidance.",
      },
      {
        id: 4,
        question: "Can I use AI astrology before talking to an astrologer?",
        answer: "Yes, you can use AI astrology features first and then connect with an astrologer for detailed guidance.",
      },
      {
        id: 5,
        question: "Is AI astrology suitable for daily guidance?",
        answer: "Yes, it can be helpful for daily horoscope, basic predictions, and general astrology insights.",
      },
    ],
    "Kundli, Horoscope and Matchmaking": [
      {
        id: 1,
        question: "Can I create my Kundli on ShubhAstro.ai?",
        answer: "Yes, you can create your Kundli by entering your birth details.",
      },
      {
        id: 2,
        question: "Can I check my daily horoscope?",
        answer: "Yes, you can check daily, weekly, monthly, and yearly horoscope.",
      },
      {
        id: 3,
        question: "Is Kundli matching available?",
        answer: "Yes, Kundli matching may be available for marriage compatibility and relationship guidance.",
      },
      {
        id: 4,
        question: "What details are needed for Kundli matching?",
        answer: "Usually, birth date, birth time, and birth place of both partners are required.",
      },
      {
        id: 5,
        question: "Can I get remedies for doshas?",
        answer: "Yes, astrology-based remedies may be suggested based on your Kundli and consultation.",
      },
    ],
    "Wallet and Payments": [
      {
        id: 1,
        question: "How do I add money to my wallet?",
        answer: "You can recharge your wallet using available online payment methods.",
      },
      {
        id: 2,
        question: "Is wallet balance required for chat or call?",
        answer: "Yes, wallet balance is required to start paid chat or call consultations.",
      },
      {
        id: 3,
        question: "Can I check my wallet balance?",
        answer: "Yes, your wallet balance will be visible in your account.",
      },
      {
        id: 4,
        question: "Can I see my transaction history?",
        answer: "Yes, you can view your recharge and consultation transaction history.",
      },
      {
        id: 5,
        question: "Are online payments secure?",
        answer: "Yes, payments are processed through secure payment systems.",
      },
    ],
    "Refunds and Failed Transactions": [
      {
        id: 1,
        question: "What if my payment is deducted but wallet is not updated?",
        answer: "You can contact support with payment details. The team will check and help you.",
      },
      {
        id: 2,
        question: "Can I get a refund for a failed consultation?",
        answer: "Refunds may be processed for valid failed sessions as per ShubhAstro.ai's refund policy.",
      },
      {
        id: 3,
        question: "How long does a refund take?",
        answer: "Refund time may depend on the payment method, bank, or payment gateway.",
      },
      {
        id: 4,
        question: "What if my chat or call disconnects?",
        answer: "You can report the issue through support. The team will review the session details.",
      },
      {
        id: 5,
        question: "Where can I raise refund-related concerns?",
        answer: "You can raise refund concerns through the help or support section.",
      },
    ],
    "Offers and Discounts": [
      {
        id: 1,
        question: "Does ShubhAstro.ai provide offers for users?",
        answer: "Yes, users may get offers, discounts, or first-session benefits from time to time.",
      },
      {
        id: 2,
        question: "How can I use an offer?",
        answer: "You can apply eligible offers during wallet recharge or consultation, based on the offer terms.",
      },
      {
        id: 3,
        question: "Why is my offer not working?",
        answer: "The offer may have expired, already been used, or may not be valid for your account.",
      },
      {
        id: 4,
        question: "Can offers be combined?",
        answer: "Offer combination depends on the terms and conditions of the specific offer.",
      },
      {
        id: 5,
        question: "Where can I see available offers?",
        answer: "Available offers may be shown on the app, website, wallet, or recharge section.",
      },
    ],
    "Privacy and User Safety": [
      {
        id: 1,
        question: "Are my personal questions kept private?",
        answer: "Yes, your personal questions and consultation details are handled with privacy.",
      },
      {
        id: 2,
        question: "Can I report inappropriate behavior of Astrologer?",
        answer: "Yes, you can report any inappropriate behavior of Astrologer through the support section.",
      },
      {
        id: 3,
        question: "Can astrologers ask for my personal contact details?",
        answer: "Users should avoid sharing personal contact details during consultation.",
      },
      {
        id: 4,
        question: "Does ShubhAstro.ai record sessions?",
        answer: "Session details may be reviewed for quality, safety, support, and dispute resolution as per company policy.",
      },
      {
        id: 5,
        question: "What should I do if I feel uncomfortable during a session?",
        answer: "You can end the session and report the issue to ShubhAstro support.",
      },
    ],
    "Technical Support": [
      {
        id: 1,
        question: "What should I do if the app is not working?",
        answer: "Please check your internet connection, update the app, and try again.",
      },
      {
        id: 2,
        question: "What if chat or call is not connecting?",
        answer: "You can refresh the app or try again after some time. If the issue continues, contact support team.",
      },
      {
        id: 3,
        question: "Can I use ShubhAstro.ai on mobile and desktop?",
        answer: "Yes, you may use ShubhAstro.ai on supported devices and browsers.",
      },
      {
        id: 4,
        question: "How can I contact customer support?",
        answer: "You can contact support through the help or support section on the ShubhAstro website or app.",
      },
      {
        id: 5,
        question: "How long does support take to reply?",
        answer: "The support team will respond as per ShubhAstro.ai's support policy and working hours.",
      },
    ],
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  return (
    <div className={styles.faqPage}>
      {/* Header */}
      {!isWebview && (
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button 
            className={styles.backButton} 
            onClick={() => {
              if (fromTab === "Support") {
                navigate("/profile", { state: { activeTab: "Support" } });
              } else {
                navigate(-1);
              }
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>FAQ's</h1>
          <div className={styles.headerSpacer}></div>
        </div>
      </header>
      )}

      {/* Content */}
      <div className={styles.content}>
        {/* Intro Text */}
        <div className={styles.introSection}>
          <h2 className={styles.introTitle}>
            Find Clear Answers to All Your Astrology App Questions. Select from the topics below
          </h2>
        </div>

        {/* Category Pills */}
        <div className={styles.categoryContainer}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryPill} ${
                selectedCategory === category.label ? styles.active : ""
              }`}
              onClick={() => {
                setSelectedCategory(category.label);
                setExpandedQuestion(null);
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className={styles.faqList}>
          {faqData[selectedCategory]?.map((faq) => (
            <div key={faq.id} className={styles.faqItem}>
              <button
                className={styles.faqQuestion}
                onClick={() => toggleQuestion(faq.id)}
              >
                <span className={styles.questionText}>{faq.question}</span>
                <span className={styles.iconWrapper}>
                  {expandedQuestion === faq.id ? (
                    <Minus size={20} className={styles.icon} />
                  ) : (
                    <Plus size={20} className={styles.icon} />
                  )}
                </span>
              </button>
              {expandedQuestion === faq.id && (
                <div className={styles.faqAnswer}>
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support Section */}
        <div className={styles.contactSection}>
          <p className={styles.contactText}>Still have a query?</p>
          <button
            className={styles.contactButton}
            onClick={() => navigate("/customer-support")}
          >
            Contact Support
            <span className={styles.arrow}>›</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
