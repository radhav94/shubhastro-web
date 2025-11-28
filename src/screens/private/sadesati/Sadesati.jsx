import { useSelector } from "react-redux";
import { useGetSadesatiQuery } from "../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import styles from "./Sadesati.module.scss";
import { getToken } from "../../../utils/token";

const Sadesati = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = {
    dob: formData
      ? `${formData.day}/${formData.month}/${formData.year}`
      : "12/12/1999",
    tob: formData
      ? `${String(formData.hour).padStart(2, "0")}:${String(
          formData.min
        ).padStart(2, "0")}`
      : "12:12",
    lat: formData?.lat || 18.23,
    lon: formData?.lon || 71.34,
    tz: formData?.tzone || 5.5,
    lang: "en",
  };

  const { data, isLoading } = useGetSadesatiQuery(queryArgs);
  const sadesati = data?.response;
  const token = getToken();

  return (
    <>
      {token ? (
        <>
          <PrimaryLoader isLoading={isLoading} />
          <div className={styles.wrapper}>
            {/* Current Period */}
            <div className={styles.card}>
              <p className={styles.heading}>Current Period</p>
              <div className={styles.periodBox}>
                <p className={styles.periodText}>{sadesati?.bot_response}</p>
                <p className={styles.date}>As on {sadesati?.date_considered}</p>
              </div>
            </div>

            {/* Remedies */}
            {sadesati?.remedies?.length > 0 && (
              <div className={styles.card}>
                <p className={styles.heading}>Recommended Remedies</p>

                <div className={styles.remediesWrapper}>
                  {sadesati?.remedies?.map((item, i) => (
                    <div key={i} className={styles.remedyItem}>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className={styles.card}>
              <p className={styles.heading}>What is Sade Sati</p>
              <div className={styles.descriptionBox}>
                <p>{sadesati?.description}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.loginCard}>
          <p className={styles.loginText}>
            Please login to view your Sadesati details.
          </p>

          <button
            className={styles.loginButton}
            onClick={() =>
              navigate("/login", { state: { from: location.pathname } })
            }
          >
            Login
          </button>
        </div>
      )}
    </>
  );
};

export default Sadesati;
