// Convert 12-hour + AM/PM → 24-hour
export const convertTo24Hour = (hour, meridiem) => {
  let h = Number(hour);

  if (meridiem === "AM") {
    return h === 12 ? 0 : h;
  }

  // PM
  return h === 12 ? 12 : h + 12;
};

// Format DOB → DD/MM/YYYY
export const formatDOB = (day, month, year) => {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(
    2,
    "0"
  )}/${year}`;
};

// Format TOB → HH:MM
export const formatTOB = (hour, min, meridiem) => {
  const h = Number(hour);

  // ✅ if meridiem is missing, assume already 24-hour
  const hour24 = meridiem ? convertTo24Hour(h, meridiem) : h;

  return `${String(hour24).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

// Build common Kundli Payload for all APIs
export const buildVedicParam = (formData, extraFields = {}) => {
  if (!formData) return null;
  return {
    dob: formatDOB(formData.day, formData.month, formData.year),

    //  uses 24-hour format
    tob: formatTOB(formData.hour, formData.min, formData.meridiem),

    lat: formData.lat,
    lon: formData.lon,
    tz: formData.tzone,
    lang: "en",
    ...extraFields,
  };
};
