import axios from "axios";

const publicRequest = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL,
});

export const get = (endPoint) => {
  return publicRequest.get(endPoint);
};

export const post = (endPoint, data) => {
  return publicRequest.post(endPoint, data);
};

export const put = (endPoint, id, data) => {
  return publicRequest.put(`${endPoint}/${id}`, data);
};

export const deleteRequest = (endPoint, id) => {
  return publicRequest.delete(`${endPoint}/${id}`);
};

export default publicRequest;
