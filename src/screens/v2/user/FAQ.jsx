import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Plus, Minus } from "lucide-react";
import styles from "./FAQ.module.scss";

const FAQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("Payments & Refunds");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const fromTab = location.state?.fromTab;
  const isWebview = new URLSearchParams(location.search).get("type") === "webview";

  const categories = [
    { id: 1, label: "Account & Profile" },
    { id: 2, label: "Payments & Refunds" },
    { id: 3, label: "Offers & Wallets" },
    { id: 4, label: "Privacy & Data Security" },
    { id: 5, label: "App Features & Navigation" },
    { id: 6, label: "Consultations & Bookings" },
  ];

  const faqData = {
    "Payments & Refunds": [
      {
        id: 1,
        question: "How long do refunds take?",
        answer: "Refunds typically take 5-7 business days to process and reflect in your account. The exact time may vary depending on your bank or payment method.",
      },
      {
        id: 2,
        question: "My payment went, but the consultation didn't start. What should I do?",
        answer: "If the amount is deducted but your session didn't begin, your booking will auto-retry. If it still doesn't start, raise a ticket and our team will review it and issue a refund if applicable.",
      },
      {
        id: 3,
        question: "Will I get a refund if the astrologer doesn't respond or ends the session early?",
        answer: "Yes, if the astrologer doesn't respond within the allocated time or ends the session prematurely without valid reason, you are eligible for a full or partial refund based on the session duration.",
      },
      {
        id: 4,
        question: "I was charged twice. How can I fix this?",
        answer: "If you notice duplicate charges, please contact our support team immediately with your transaction details. We will investigate and process a refund for the duplicate charge within 7-10 business days.",
      },
      {
        id: 5,
        question: "Can I cancel a booked session?",
        answer: "Yes, you can cancel a booked session up to 2 hours before the scheduled time for a full refund. Cancellations made within 2 hours of the session may not be eligible for a refund.",
      },
    ],
    "Account & Profile": [
      {
        id: 1,
        question: "How do I update my profile information?",
        answer: "You can update your profile by going to Settings > Profile and editing your details such as name, email, phone number, and birth details.",
      },
      {
        id: 2,
        question: "Can I delete my account?",
        answer: "Yes, you can delete your account from Settings > Account > Delete Account. Please note that this action is irreversible and all your data will be permanently removed.",
      },
    ],
    "Offers & Wallets": [
      {
        id: 1,
        question: "How do I use my wallet balance?",
        answer: "Your wallet balance is automatically applied during checkout. You can also view your wallet balance and transaction history in the Wallet section of your profile.",
      },
      {
        id: 2,
        question: "Do promotional offers expire?",
        answer: "Yes, promotional offers have expiry dates. You can check the validity period in the Offers section or in the offer details.",
      },
    ],
    "Privacy & Data Security": [
      {
        id: 1,
        question: "Is my personal information secure?",
        answer: "Yes, we use industry-standard encryption and security measures to protect your personal information. We never share your data with third parties without your consent.",
      },
      {
        id: 2,
        question: "Can I control who sees my birth details?",
        answer: "Yes, your birth details are only visible to astrologers during consultations. You can manage privacy settings from your profile.",
      },
    ],
    "App Features & Navigation": [
      {
        id: 1,
        question: "How do I book a consultation?",
        answer: "Browse astrologers, select one, choose chat/call/video, and proceed to payment. Your session will start once the astrologer accepts.",
      },
      {
        id: 2,
        question: "What are the different types of readings available?",
        answer: "We offer Kundli, Horoscope, Tarot, Numerology, Palmistry, Face Reading, and more. Each service provides unique insights into different aspects of your life.",
      },
    ],
    "Consultations & Bookings": [
      {
        id: 1,
        question: "Can I reschedule a consultation?",
        answer: "Yes, you can reschedule up to 2 hours before the scheduled time. Go to your bookings and select the reschedule option.",
      },
      {
        id: 2,
        question: "What if the astrologer is not available?",
        answer: "If an astrologer becomes unavailable, you'll be notified and can choose another astrologer or get a full refund.",
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
