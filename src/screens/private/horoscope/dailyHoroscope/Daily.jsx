import { PrimaryText } from "../../../../component";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import { appColors } from "../../../../utils/theme";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import Card from "../../../../component/UI/cards/cardwithimage/Card";
import { zodiac } from "../zodiac";
import styles from "./Daily.module.scss";
import { Link } from "react-router-dom";


const Daily = () => {
    const [description, horoDisc, onChat, onClickSign, data] = zodiac();
    
    return (
        <div className={styles.dailyContainer}>
            <PrimaryText isCenter isBold size_32>
                Daily Horoscope
            </PrimaryText>
            <PrimaryText isCenter isSemiBold size_18 color={appColors.greyDark}>
                Check your Horoscope Today
            </PrimaryText>
            <DividerWithImage imageSrc={ShubhTalkLogo} />
            
           <div className={styles.cardsContainer} > {data.signs.map((zod) => {
                return (
                  <Link to={`/horoscopes/daily-horoscope/${zod.name.toLowerCase()}`} >  
                <Card key={zod.id} data={zod} scope="Daily" /> 
                </Link>
            ) // Add return here
            })}</div>
        </div>
    )
}

export default Daily;