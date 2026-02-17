const monthMap = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};
export const buildKundliPayload = (formData) => {
  const hour12 = Number(formData.hour);
  const isPM = formData.meridiem === "PM";

  // ✅ only convert when PM
  const hour24 = isPM && hour12 < 12 ? hour12 + 12 : hour12;

  return {
    name: formData.name,
    gender: formData.gender?.toLowerCase(),
    day: Number(formData.day),
    month: monthMap[formData.month],
    year: Number(formData.year),

    //  FIXED - Format as 2-digit strings
    hour: String(hour24).padStart(2, "0"),
    min: String(Number(formData.minute)).padStart(2, "0"),

    second: "00",
    place: formData.birthPlace,
    lat: Number(formData.latitude),
    lon: Number(formData.longitude),
    tzone: 5.5,
  };
};
