import { useParams } from "react-router-dom"
import styles from './SignScreen.module.scss'
import { PrimaryText } from "../../../component"
import { appColors } from "../../../utils/theme";

import {appSvgs} from '../../../utils/appImages'
import DividerWithImage from "../../../component/UI/DividerWithImage";

const SignScreen = ()=>{
    const {sign} = useParams()
    return (
        <div className={styles.dailyContainer}>
            <PrimaryText isCenter isBold size_32>
                {sign.charAt(0).toUpperCase()+sign.slice(1)} Daily Horoscope
            </PrimaryText>
            <PrimaryText isCenter isSemiBold size_18 color={appColors.greyDark}>
                {new Date().toString().slice(3,15)}
            </PrimaryText>
            <DividerWithImage imageSrc={appSvgs[sign.charAt(0).toUpperCase()+sign.slice(1)]} />
        </div>
    )
}
export default SignScreen