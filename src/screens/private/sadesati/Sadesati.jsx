import { useSelector } from "react-redux";
import { useGetSadesatiQuery } from "../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import styles from "./Sadesati.module.scss";
import { getToken } from "../../../utils/token";
import { FaClock, FaMoon, FaUserClock, FaBookReader } from "react-icons/fa";
import { GiStonePath, GiMeditation } from "react-icons/gi";
import { MdOutlineTipsAndUpdates } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { buildVedicParam } from "../../../utils/VedicParams.js/vedicParams";

const Sadesati = () => {
  const navigate = useNavigate();
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData ? buildVedicParam(formData) : null;

  const { data, isLoading } = useGetSadesatiQuery(queryArgs);
  const sadesati = data?.response;
  const token = getToken();

  const isInSadeSati = sadesati?.shani_period_type;

  return (
    <>
      {token ? (
        <>
          <PrimaryLoader isLoading={isLoading} />

          <div className={styles.wrapper}>
            {/* STATUS CARD */}
            <div className={styles.statusCard}>
              {/* <div className={styles.statusIcon}>
                <FaUserClock />
              </div> */}

              <p className={styles.statusTitle}>
                {isInSadeSati
                  ? "You Are in Sade Sati Period"
                  : "You Are Not in Sade Sati"}
              </p>

              <p className={styles.statusMessage}>{sadesati?.bot_response}</p>

              <p className={styles.dateText}>
                As on {sadesati?.date_considered}
              </p>
            </div>

            {/* REMEDIES */}
            {sadesati?.remedies?.length > 0 && (
              <div className={styles.card}>
                <div className={styles.headingBox}>
                  <GiMeditation className={styles.headingIcon} />
                  <p className={styles.heading}>Recommended Remedies</p>
                </div>

                <div className={styles.remediesGrid}>
                  {sadesati.remedies.map((item, i) => (
                    <div key={i} className={styles.remedyItem}>
                      <MdOutlineTipsAndUpdates className={styles.remedyIcon} />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            <div className={styles.card}>
              <div className={styles.headingBox}>
                <FaBookReader className={styles.headingIcon} />
                <p className={styles.heading}>What is Sade Sati?</p>
              </div>

              <p className={styles.description}>{sadesati?.description}</p>
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
