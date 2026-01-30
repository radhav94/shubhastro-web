import { useState, useRef, useEffect } from "react";
import styles from "./WheelDatePicker.module.scss";

const WheelDatePicker = ({ 
  value, 
  onChange, 
  onClose,
  minYear = 1700,
  maxYear = new Date().getFullYear() + 1000
}) => {
  // Parse initial value or use current date
  const parseDate = (dateStr) => {
    if (!dateStr) {
      const now = new Date();
      return {
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };
    }
    const [year, month, day] = dateStr.split("-").map(Number);
    return { day, month, year };
  };

  const initialDate = parseDate(value);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  
  // Double tap detection
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate years dynamically based on props
  const years = Array.from(
    { length: maxYear - minYear + 1 }, 
    (_, i) => minYear + i
  );

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Scroll handling with debounce for better performance
  const handleScroll = (ref, items, setter) => {
    if (!ref.current) return;
    
    const scrollTop = ref.current.scrollTop;
    const itemHeight = 48;
    const index = Math.round(scrollTop / itemHeight);
    const selectedIndex = Math.max(0, Math.min(index, items.length - 1));
    
    setter(items[selectedIndex]);
  };

  // Snap to nearest item on scroll end
  const handleScrollEnd = (ref, items, currentValue) => {
    if (!ref.current) return;
    
    const itemHeight = 48;
    const currentIndex = items.indexOf(currentValue);
    
    if (currentIndex !== -1) {
      ref.current.scrollTo({
        top: currentIndex * itemHeight,
        behavior: "smooth",
      });
    }
  };

  // Scroll to selected item
  const scrollToItem = (ref, index) => {
    if (!ref.current) return;
    const itemHeight = 48;
    ref.current.scrollTo({
      top: index * itemHeight,
      behavior: "smooth",
    });
  };

  // Initialize scroll positions
  useEffect(() => {
    scrollToItem(dayRef, selectedDay - 1);
    scrollToItem(monthRef, selectedMonth - 1);
    scrollToItem(yearRef, years.indexOf(selectedYear));
  }, []);

  // Adjust day if it exceeds days in selected month
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear]);

  // Auto-update the date when selection changes
  useEffect(() => {
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    onChange(formattedDate);
  }, [selectedDay, selectedMonth, selectedYear]);

  // Handle double tap to close
  const handleDoubleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      onClose();
    }
    
    lastTapRef.current = now;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.overlay}>
      <div 
        className={styles.pickerContainer} 
        onClick={(e) => {
          e.stopPropagation();
          handleDoubleTap();
        }}
      >
        <div className={styles.wheelContainer}>
          <div className={styles.selectionHighlight}></div>
          
          {/* Day Wheel */}
          <div
            className={styles.wheel}
            ref={dayRef}
            onScroll={() => handleScroll(dayRef, days, setSelectedDay)}
            onScrollEnd={() => handleScrollEnd(dayRef, days, selectedDay)}
          >
            <div className={styles.spacer}></div>
            {days.map((day) => (
              <div
                key={day}
                className={`${styles.wheelItem} ${
                  day === selectedDay ? styles.selected : ""
                }`}
                onClick={() => {
                  setSelectedDay(day);
                  scrollToItem(dayRef, day - 1);
                  setTimeout(() => onClose(), 200);
                }}
              >
                {day}
              </div>
            ))}
            <div className={styles.spacer}></div>
          </div>

          {/* Month Wheel */}
          <div
            className={styles.wheel}
            ref={monthRef}
            onScroll={() => handleScroll(monthRef, months.map((_, i) => i + 1), setSelectedMonth)}
            onScrollEnd={() => handleScrollEnd(monthRef, months.map((_, i) => i + 1), selectedMonth)}
          >
            <div className={styles.spacer}></div>
            {months.map((month, index) => (
              <div
                key={month}
                className={`${styles.wheelItem} ${
                  index + 1 === selectedMonth ? styles.selected : ""
                }`}
                onClick={() => {
                  setSelectedMonth(index + 1);
                  scrollToItem(monthRef, index);
                  setTimeout(() => onClose(), 200);
                }}
              >
                {month}
              </div>
            ))}
            <div className={styles.spacer}></div>
          </div>

          {/* Year Wheel */}
          <div
            className={styles.wheel}
            ref={yearRef}
            onScroll={() => handleScroll(yearRef, years, setSelectedYear)}
            onScrollEnd={() => handleScrollEnd(yearRef, years, selectedYear)}
          >
            <div className={styles.spacer}></div>
            {years.map((year) => (
              <div
                key={year}
                className={`${styles.wheelItem} ${
                  year === selectedYear ? styles.selected : ""
                }`}
                onClick={() => {
                  setSelectedYear(year);
                  scrollToItem(yearRef, years.indexOf(year));
                  setTimeout(() => onClose(), 200);
                }}
              >
                {year}
              </div>
            ))}
            <div className={styles.spacer}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelDatePicker;
