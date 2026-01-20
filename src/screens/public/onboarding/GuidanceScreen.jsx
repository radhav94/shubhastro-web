import { useState } from "react";
import styles from "./Onboarding.module.scss";
import { Heart, Rocket, DollarSign, Plus, User, HelpCircle } from "lucide-react";

const GuidanceScreen = ({ onNext, onSkip, formData, updateFormData }) => {
  const [selected, setSelected] = useState(formData.guidance || []);

  const options = [
    { id: "love", label: "Love & Relationships", icon: Heart, color: "#FFE5F0" },
    { id: "career", label: "Career & Growth", icon: Rocket, color: "#E5E0FF" },
    { id: "wealth", label: "Wealth & Finances", icon: DollarSign, color: "#E5F9E5" },
    { id: "health", label: "Health & Well-Being", icon: Plus, color: "#E0F2FF" },
    { id: "self", label: "Self-understanding", icon: User, color: "#FFE5F0" },
    { id: "others", label: "Others", icon: HelpCircle, color: "#FFF4E0" },
  ];

  const toggleOption = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    updateFormData({ guidance: selected });
    onNext();
  };

  return (
    <div className={styles.guidanceScreen}>
      <div className={styles.header}>
        <div className={styles.progressDots}>
          <span className={styles.dotInactive}></span>
          <span className={styles.dotInactive}></span>
          <span className={styles.dotActive}></span>
        </div>
        <button className={styles.skipBtn} onClick={onSkip}>
          Skip for Now
        </button>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>What brings you here today?</h1>
        <p className={styles.subtitle}>
          Choose what you'd like guidance on love, career, health or more.
        </p>

        <div className={styles.optionsGrid}>
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = selected.includes(option.id);
            return (
              <button
                key={option.id}
                className={`${styles.optionCard} ${isSelected ? styles.selected : ""}`}
                style={{ backgroundColor: option.color }}
                onClick={() => toggleOption(option.id)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                <div className={styles.optionIcon}>
                  <Icon size={24} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button className={styles.otpprimaryBtn} onClick={handleNext}>
        Next
      </button>
    </div>
  );
};

export default GuidanceScreen;
