import axios from "axios";
import { PYTHON_PROXY } from "../../utils/apiConfig";

const AshtakVargaApiInstance = axios.create({
  baseURL: `${PYTHON_PROXY}/api/astrology/`,
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