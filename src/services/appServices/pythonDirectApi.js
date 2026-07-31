import axios from "axios";

const AshtakVargaApiInstance = axios.create({
  baseURL: "/chart/api/astrology/",
  headers: {
    "Content-Type": "application/json",
  },
});

export const callAshtakVargaAPI = async (endpoint, data, language = "en") => {
  try {
    const response = await AshtakVargaApiInstance.post(endpoint, data, {
      headers: {
        "Accept-Language": language,
      },
    });

    return response.data;
  } catch (error) {
    Toast.error("Error ", error.toString());
    return null;
  }
};