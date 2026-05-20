import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLoveCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect, useState } from "react";
import styles from "./LoveReport.module.scss";
import { PrimaryText } from "../../../../component";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import CalcBackButton from "../CalcBackButton";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import { Share2, ChevronDown } from "lucide-react";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";

const LoveReport = () => {
  const navigate = useNavigate();
  const stored = useSelector(selectCalculatorData("love_calculator"));

  const [loveCalculator, { data, isLoading, isError, error }] =
    useLoveCalculatorMutation();

  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    if (!stored) return;

    loveCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Love calculator error:", err);
      });
  }, []); // run once

  const toggleAccordion = (index) => {
    setOpenAccordion((prev) => (prev === index ? null : index));
  };

  const handleShare = async () => {
    const shareData = {
      title: "Love Calculator Result",
      text: `${report.name1} ❤️ ${report.name2} - ${report.score}% Love Match!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
      }
    } catch (_err) {
      /* user cancelled */
    }
  };

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (isError) return <div>No data found</div>;

  const report = data?.data;
  if (!report) return null;

  const sections = report.sections || [];
  const connectCardIndex = Math.min(2, sections.length);
  const sectionsBeforeCard = sections.slice(0, connectCardIndex);
  const sectionsAfterCard = sections.slice(connectCardIndex);

  return (
    <div className={styles.pageWrapper}>
      <CalcBackButton />

      {/* Page Title */}
      <div className={styles.header}>
        <h2>Love Calculator Results</h2>
        <div className={styles.headingUnderline}>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
            </svg>
          </div>
          <span className={styles.dividerMoon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
              <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303" />
            </svg>
          </span>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
            </svg>
          </div>
        </div>
      </div>

      {/* Intro Text */}
      {/* <PrimaryText className={styles.introText} size_16>
        Have you ever thought if you and your crush are a perfect match? A love
        calculator is a fun and simple tool that tells you your love percentage
        and how well you both connect. Just enter names, birth dates, or even
        zodiac signs, and see the result!
      </PrimaryText>
      <PrimaryText className={styles.introText} size_16>
        Finding love isn&apos;t always easy, but tools like the love calculator make
        it exciting. They help you understand your feelings and check your
        romantic compatibility. Many people use it for fun and to explore their
        bond before starting a relationship. Try it and see what your stars say!
      </PrimaryText> */}

      {/* RESULTS Section */}
      <div className={styles.resultsSection}>
        {/* Result Card */}
        <div className={styles.resultCard}>
          {/* Share Button */}
          <button
            className={styles.shareBtn}
            onClick={handleShare}
            aria-label="Share result"
            style={{ display: 'none' }}
          >
            <Share2 size={18} />
          </button>

          <p className={styles.subLabel}>Percentage of love between</p>
          <h3 className={styles.namesRow}>
            {report.name1} <span className={styles.heart}>❤️</span> {report.name2}
          </h3>

          {/* Score + Info Row */}
          <div className={styles.scoreRow}>
            <div className={styles.circleOuter}>
              <svg className={styles.circleSvg} viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#ffe0cc"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#f75801"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(report.score / 100) * 327} 327`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <span className={styles.circleText}>{report.score}%</span>
            </div>

            <div className={styles.scoreInfo}>
              <h4 className={styles.scoreTitle}>{report.title}</h4>
              <p className={styles.scoreDesc}>{report.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            className={styles.calcAgainBtn}
            onClick={() => navigate("/love-calculator")}
          >
            Calculate Again
          </button>
          <button
            className={styles.horoscopeBtn}
            onClick={() => navigate("/horoscope/todays-horoscope")}
          >
            ❤ Get today&apos;s love Horoscope
          </button>
        </div>
      </div>

      {/* Accordion Sections */}
      {sections.length > 0 && (
        <div className={styles.accordionList}>
          {sectionsBeforeCard.map((section, index) => (
            <div key={index} className={styles.accordionItem}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion(index)}
                aria-expanded={openAccordion === index}
              >
                <span className={styles.accordionTitle}>{section.title}</span>
                <ChevronDown
                  size={20}
                  className={`${styles.chevron} ${openAccordion === index ? styles.chevronOpen : ""}`}
                />
              </button>
              <div
                className={`${styles.accordionBody} ${openAccordion === index ? styles.accordionBodyOpen : ""}`}
              >
                <p>{section.content}</p>
              </div>
            </div>
          ))}

          {/* Connect Card between accordion items */}
          <div className={styles.connectCardWrap}>
            <ConnectCard />
          </div>

          {sectionsAfterCard.map((section, index) => {
            const realIndex = connectCardIndex + index;
            return (
              <div key={realIndex} className={styles.accordionItem}>
                <button
                  className={styles.accordionHeader}
                  onClick={() => toggleAccordion(realIndex)}
                  aria-expanded={openAccordion === realIndex}
                >
                  <span className={styles.accordionTitle}>{section.title}</span>
                  <ChevronDown
                    size={20}
                    className={`${styles.chevron} ${openAccordion === realIndex ? styles.chevronOpen : ""}`}
                  />
                </button>
                <div
                  className={`${styles.accordionBody} ${openAccordion === realIndex ? styles.accordionBodyOpen : ""}`}
                >
                  <p>{section.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback: show ConnectCard even if no sections */}
      {sections.length === 0 && (
        <div className={styles.connectCardWrap}>
          <ConnectCard />
        </div>
      )}
    </div>
  );
};

export default LoveReport;
