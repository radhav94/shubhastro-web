import axios from "axios";
import { Toast } from "../../component";
import { ASTROLOGY_PROXY } from "../../utils/apiConfig";

const userId = import.meta.env.VITE_VEDIC_API_USER_ID;
const apiKey = import.meta.env.VITE_VEDIC_API_KEY;

const auth = `Basic ${btoa(userId + ":" + apiKey)}`;

const astrologyApiInstance = axios.create({
  baseURL: `${ASTROLOGY_PROXY}/v1/`,
  headers: {
    Authorization: auth,
    "Content-Type": "application/json",
  },
});

export const callAstrologyAPI = async (endpoint, data, language = "en") => {
  try {
    const response = await astrologyApiInstance.post(endpoint, data, {
      headers: {
        "Accept-Language": language,
      },
    });

    return response.data;
  } catch (error) {
    // Toast.error("Error ", error.toString());
    return null;
  }
};

