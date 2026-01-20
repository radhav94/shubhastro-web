export const capitalizeWords = (str) => {
  if (!str) return str;
  return String(str)
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
