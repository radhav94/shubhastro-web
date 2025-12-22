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
  return {
    name: formData.name,
    gender: formData.gender?.toLowerCase(),
    day: Number(formData.day),
    month: monthMap[formData.month],
    year: Number(formData.year),
    hour: Number(formData.hour),
    min: Number(formData.minute),
    second: Number(formData.second),
    place: formData.birthPlace,
    lat: Number(formData.latitude),
    lon: Number(formData.longitude),
    tzone: 5.5,
  };
};
