import { PrimaryText } from "../../../component";
import DividerWithImage from "../../../component/UI/DividerWithImage";
import { appColors } from "../../../utils/theme";
import ShubhTalkLogo from "../../../assets/icons/logo.png";
import Card from "../../../component/UI/cards/cardwithimage/Card";
import { zodiac } from "./zodiac";
import styles from "./SignScreen.module.scss";
import { Link, useLocation } from "react-router-dom";

const SignScreen = () => {
  const [description, horoDisc, onChat, onClickSign, data] = zodiac();
  const { pathname } = useLocation();
  let horoscopeType = pathname.split("/")[2].split("-")[0];
  horoscopeType =
    horoscopeType.charAt(0).toUpperCase() + horoscopeType.slice(1);

  return (
    <div className={styles.dailyContainer}>
      <PrimaryText isCenter isBold size_32>
        {horoscopeType} Horoscope
      </PrimaryText>
      <PrimaryText isCenter isSemiBold size_18 color={appColors.greyDark}>
        Check your Horoscope Today
      </PrimaryText>
      <DividerWithImage imageSrc={ShubhTalkLogo} />

      <div className={styles.cardsContainer}>
        {" "}
        {data.signs.map((zod) => {
          return (
            <Link
              key={zod.id}
              to={`/horoscopes/${
                pathname.split("/")[2]
              }/${zod.name.toLowerCase()}`}
            >
              <Card data={zod} scope={horoscopeType} />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SignScreen;
