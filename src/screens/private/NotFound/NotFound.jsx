import { useNavigate } from "react-router-dom";
import { PrimaryButton, PrimaryText } from "../../../component";
import { appColors } from "../../../utils/theme";
import styles from "./NotFound.module.scss";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        
        <PrimaryText 
          size_24 
          isExtraBold 
          color={appColors.tri}
          style={{ marginBottom: "12px" }}
        >
          Page Not Found
        </PrimaryText>
        
        <PrimaryText 
          size_14 
          color={appColors.greyMedium}
          style={{ marginBottom: "32px", textAlign: "center", maxWidth: "400px" }}
        >
          The page you are looking for doesn't exist or has been moved.
        </PrimaryText>

        <div className={styles.buttonGroup}>
          <PrimaryButton
            title="Go to Home"
            onClick={handleGoHome}
            bgColor={appColors.tri}
            textColor={appColors.white}
            buttonStyles={{ minWidth: "140px" }}
          />
          
          <PrimaryButton
            title="Go Back"
            onClick={handleGoBack}
            transparent
            textColor={appColors.tri}
            borderColor={appColors.tri}
            buttonStyles={{ minWidth: "140px" }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotFound;