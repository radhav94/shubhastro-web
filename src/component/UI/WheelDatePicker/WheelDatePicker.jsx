import { useState, useRef, useEffect } from "react";
import styles from "./WheelDatePicker.module.scss";

const WheelDatePicker = ({ 
  value, 
  onChange, 
  onClose,
  minYear = 1700,
  maxYear = new Date().getFullYear() // Default to current year
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Parse initial value or use current date
  const parseDate = (dateStr) => {
    if (!dateStr) {
      return {
        day: currentDay,
        month: currentMonth,
        year: currentYear,
      };
    }
    const [year, month, day] = dateStr.split("-").map(Number);
    
    // Prevent future dates
    const parsedDate = new Date(year, month - 1, day);
    if (parsedDate > today) {
      return {
        day: currentDay,
        month: currentMonth,
        year: currentYear,
      };
    }
    
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

  // Get available months based on selected year
  const getAvailableMonths = (year) => {
    // If selected year is current year, only show months up to current month
    if (year === currentYear) {
      return months.slice(0, currentMonth);
    }
    return months;
  };

  const availableMonths = getAvailableMonths(selectedYear);

  // Generate years dynamically based on props (never exceed current year)
  const years = Array.from(
    { length: Math.min(maxYear, currentYear) - minYear + 1 }, 
    (_, i) => minYear + i
  );

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // Get available days based on selected month/year
  const getAvailableDays = (month, year) => {
    const totalDays = getDaysInMonth(month, year);
    
    // If selected year and month are current, limit to current day
    if (year === currentYear && month === currentMonth) {
      return Array.from({ length: currentDay }, (_, i) => i + 1);
    }
    
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = getAvailableDays(selectedMonth, selectedYear);

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
    const maxAvailableDay = days[days.length - 1] || 1;
    if (selectedDay > maxAvailableDay) {
      setSelectedDay(maxAvailableDay);
    }
  }, [selectedMonth, selectedYear, days]);

  // Adjust month if it exceeds available months for selected year
  useEffect(() => {
    if (selectedYear === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [selectedYear]);

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
            onScroll={() => handleScroll(monthRef, availableMonths.map((_, i) => i + 1), setSelectedMonth)}
            onScrollEnd={() => handleScrollEnd(monthRef, availableMonths.map((_, i) => i + 1), selectedMonth)}
          >
            <div className={styles.spacer}></div>
            {availableMonths.map((month, index) => (
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
