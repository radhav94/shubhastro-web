export const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

export const requiredMessage = (name = "This field") => {
  return `${name} is required!`;
};
