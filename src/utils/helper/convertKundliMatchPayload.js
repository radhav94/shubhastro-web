
export const convertToMatchPayload = (boy, girl) => {
  const formatDate = (dob) => {
    const [year, month, day] = dob.split("-"); // YYYY-MM-DD
    return `${day}/${month}/${year}`; // DD/MM/YYYY
  };

  return {
    boy_dob: formatDate(boy.dob),
    boy_tob: boy.tob,
    boy_tz: 5.5,
    boy_lat: boy.place.lat,
    boy_lon: boy.place.lng,

    girl_dob: formatDate(girl.dob),
    girl_tob: girl.tob,
    girl_tz: 5.5,
    girl_lat: girl.place.lat,
    girl_lon: girl.place.lng,
    lang: "en",
  };
};
