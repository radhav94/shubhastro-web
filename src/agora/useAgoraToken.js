import axios from "axios";
import { useState } from "react";

const BACKEND = "https://njsapi-shubhtalk.epicon.in/"; // change to production URL

export const useAgoraToken = () => {
  const [loading, setLoading] = useState(false);

  const getToken = async ({ channelName, uid }) => {
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND}`, {
        channelName,
        uid,
        role: "publisher",
      });

      setLoading(false);
      return res.data; // appId, token, uid
    } catch (err) {
      setLoading(false);
      console.error(err);
      return null;
    }
  };

  return { getToken, loading };
};
