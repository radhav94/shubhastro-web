export const padZero = (value) => {
  if (value === null || value === undefined) return "00";
  return Number(value) < 10 ? `0${value}` : `${value}`;
};

export const format12HourTime = (hour, min) => {
  const h = Number(hour);
  const m = Number(min);

  const meridiem = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;

  return `${padZero(hour12)}:${padZero(m)} ${meridiem}`;
};
