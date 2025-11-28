const role = localStorage.getItem("shubhtalk_role");
export const getToken = () => {
  return role === "ASTROLOGER"
    ? localStorage.getItem("shubhtalk_astro_token")
    : localStorage.getItem("shubhtalk_customer_token");
};
