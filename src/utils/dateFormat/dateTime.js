export const padZero = (value) => {
    if (value === null || value === undefined) return "00";
    return Number(value) < 10 ? `0${value}` : `${value}`;
  };
  