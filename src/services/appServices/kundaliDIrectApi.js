import axios from "axios";
import { Toast } from "../../component";

const userId = "646670";
const apiKey = "2e402065d9ab99588046b881a81727b00c7138e5";

const auth = `Basic ${btoa(userId + ":" + apiKey)}`;

const astrologyApiInstance = axios.create({
  baseURL: "https://json.astrologyapi.com/v1/",
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

