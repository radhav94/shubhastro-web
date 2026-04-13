import { useNavigate } from "react-router-dom";
import { appData } from "../../../utils/constanats/appData";
import { PATH } from "../../../utils/routes/Paths";

export const useAstrLive = () => {
  const data = appData;
  const navigate = useNavigate();

  const onWatchNow = (item) => {
    const currentIndex = data.findIndex(
      (e) => e.AstrologerLoginId === item.AstrologerLoginId
    );
    navigate(PATH.privateRoutes.STREAMING.path, {
      state: { data: item, list: data, currentIndex },
    });
  };

  return [data, onWatchNow];
};
