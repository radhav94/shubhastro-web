import { useNavigate } from "react-router-dom";
import { appData } from "../../../utils/constanats/appData";
import { PATH } from "../../../utils/routes/Paths";

export const useAstrLive = () => {
  const data = appData;
  const navigate = useNavigate();

  const onWatchNow = (data) => {
    console.log(data);
    navigate(PATH.privateRoutes.STREAMING.path, { state: { data } });
  };

  return [data, onWatchNow];
};
