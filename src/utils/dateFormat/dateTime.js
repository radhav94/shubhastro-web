export const padZero = (value) => {
  if (value === null || value === undefined) return "00";
  return Number(value) < 10 ? `0${value}` : `${value}`;
};

export const format12HourTime = (hour, minute, meridiem) => {
  if (hour === undefined || minute === undefined) return "--";

  let h = Number(hour);
  const m = Number(minute);

  let suffix = meridiem;

  // If meridiem not provided, derive from 24-hour time
  if (!suffix) {
    suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
  }

  return `${padZero(h)}:${padZero(m)} ${suffix}`;
};

// export const format12HourTime = (hour, min) => {
//   const h = Number(hour);
//   const m = Number(min);

//   const meridiem = h >= 12 ? "PM" : "AM";
//   const hour12 = h % 12 || 12;

//   return `${padZero(hour12)}:${padZero(m)} ${meridiem}`;
// };
