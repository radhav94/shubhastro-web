const today = new Date();
export const formatted = today.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export const TODAY = new Date().toISOString().split("T")[0];
