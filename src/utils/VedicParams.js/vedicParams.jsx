// Format DOB → DD/MM/YYYY
export const formatDOB = (day, month, year) => {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(
    2,
    "0"
  )}/${year}`;
};

// Format TOB → HH:MM
export const formatTOB = (hour, min) => {
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

// Build common Kundli Payload for all APIs
export const buildVedicParam = (formData, extraFields = {}) => {
  if (!formData) return null;

  return {
    dob: formatDOB(formData.day, formData.month, formData.year),
    tob: formatTOB(formData.hour, formData.min),
    lat: formData.lat,
    lon: formData.lon,
    tz: formData.tzone,
    lang: "en",
    ...extraFields, // dynamic fields like planet, chartType, etc.
  };
};
