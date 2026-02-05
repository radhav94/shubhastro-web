import { PrimaryText } from "../../../component";
import DividerWithImage from "../../../component/UI/DividerWithImage";
import { appColors } from "../../../utils/theme";
import ShubhTalkLogo from "../../../assets/icons/logo.png";
import Card from "../../../component/UI/cards/cardwithimage/Card";
import { zodiac } from "./zodiac";
import styles from "./SignScreen.module.scss";
import { Link, useLocation } from "react-router-dom";

const SignScreen = () => {
  const [data] = zodiac();
  const { pathname } = useLocation();
  let horoscopeType = pathname.split("/")[2].split("-")[0];
  horoscopeType =
    horoscopeType.charAt(0).toUpperCase() + horoscopeType.slice(1);
  let subTitleStr;
  switch (horoscopeType) {
    case "Todays":
      subTitleStr = "Check your Today's Horoscope";
      break;
    case "Daily":
      subTitleStr = "Check your horoscope today";
      break;
    case "Weekly":
      subTitleStr = "Sunday - Saturday";
      break;
    case "Yearly":
      subTitleStr = new Date().getFullYear();
      break;
  }

  return (
    <div className={styles.dailyContainer}>
      <h1 className={styles.title}>
        {horoscopeType} Horoscope
      </h1>
      <PrimaryText
        marginBottom="6px"
        isCenter
        isSemiBold
        size_20
        color={appColors.greyDark}
      >
        {subTitleStr}
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
