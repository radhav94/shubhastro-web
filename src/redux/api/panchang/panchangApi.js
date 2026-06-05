import { vedicApi } from "../baseApi/vedicApi";
import { getCurrentLang } from "../../../utils/VedicParams.js/vedicParams";

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
          date: `${formData.day}/${formData.month}/${formData.year}`, // DD/MM/YYYY
          time: `${formData.hour}:${formData.min}`, // HH:MM
          lat: formData.lat,
          lon: formData.lon,
          tz: 5.5, // Default timezone
          lang: getCurrentLang(),
        },
      }),
    }),
  }),
});

export const { useFetchAdvancePanchangQuery } = panchangApi;
