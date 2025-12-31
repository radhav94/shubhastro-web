import { toast as rht } from "react-hot-toast";

const options = {
  duration: 5000,
  position: "top-right",
    zIndex: 9999999999,
};

const success = (msg) => {
  return rht.success(msg, options);
};

const error = (msg) => {
  return rht.error(msg, options);
};

const warning = (msg) => {
  return rht(msg, { ...options, icon: "⚠️" });
};

const promise = (myPromise, msgObj) => {
  return rht.promise(myPromise, msgObj, options);
};

const toast = {
  success,
  error,
  warning,
  promise,
};

export default toast;
