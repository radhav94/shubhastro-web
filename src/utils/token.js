export const getToken = () => {
  const role = localStorage.getItem("shubhtalk_role");
  return role === "ASTROLOGER"
    ? localStorage.getItem("shubhtalk_astro_token")
    : localStorage.getItem("shubhtalk_customer_token");
};
