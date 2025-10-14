export const appShadow = {
  2: "0px 2px 4px rgba(0,0,0,0.1)",
  4: "0px 4px 6px rgba(0,0,0,0.1)",
  6: "0px 6px 8px rgba(0,0,0,0.1)",
  8: "0px 8px 12px rgba(0,0,0,0.1)",
};

export const appColors = {
  pri: "#ffcb03",
  sec: "#fbf1dd",
  tri: "#BB1160",

  white: "#ffff",
  black: "#1a1a1a",
  btn: "#57A8E0",
  sucess: "#8bc34a",
  app_bg: "#F5F5F5",

  greyLight: "#e0e0e0",
  greyMedium: "#999999",
  greyDark: "#555555",
};

export const getWidth = () => {
  if (typeof window !== "undefined") {
    return (
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth
    );
  }
  return 0;
};

export const getHeight = () => {
  if (typeof window !== "undefined") {
    return (
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight
    );
  }
  return 0;
};
