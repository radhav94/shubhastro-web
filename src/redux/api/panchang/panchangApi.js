import { vedicApi, VEDIC_API_KEY } from "../baseApi/vedicApi";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export const panchangApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchAdvancePanchang: builder.query({
      query: (formData) => ({
        url: "panchang/panchang",
        params: {
          api_key: VEDIC_API_KEY,
          date: `${formData.day}/${formData.month}/${formData.year}`, // DD/MM/YYYY
          time: `${formData.hour}:${formData.min}`, // HH:MM
          lat: formData.lat,
          lon: formData.lon,
          tz: 5.5, // Default timezone
          lang: "en",
        },
      }),
    }),
  }),
});

export const { useFetchAdvancePanchangQuery } = panchangApi;
