export const combineClasses = (...classes) => {
  return classes.join(" ");
};

export const requiredMessage = (name = "This field") => {
  return `${name} is required!`;
};
