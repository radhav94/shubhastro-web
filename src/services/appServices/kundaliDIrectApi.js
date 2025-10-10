import axios from "axios";
import { Toast } from "../../component";

const userId = "646044";
const apiKey = "09ad1f71dcf3806f7f2c083d435d069295668b5f";

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
    Toast.error("Error ", error.toString());
    return null;
  }
};
