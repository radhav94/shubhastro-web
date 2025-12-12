import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { PrimaryText } from "../../../../component";
import styles from "./Sidebar.module.scss";

const Sidebar = () => {
  const navigate = useNavigate();
  const zodiacSigns = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  const { sign: paramSign } = useParams();
  const { pathname } = useLocation();

  const horoscopeType = pathname?.split("/")[2];

  const defaultSign = paramSign?.charAt(0).toUpperCase() + paramSign.slice(1);

  const hanldeSelectChange = (e) => {
    const selectedSign = e.target.value.toLowerCase();
    navigate(`/horoscopes/${horoscopeType}/${selectedSign}`);
  };

  //   const activeLink =

  return (
    <div className={styles.sidebar}>
      <div className={styles.leftContainer}>
        <PrimaryText isSemiBold size_20>
          SELECT OTHER SIGN
        </PrimaryText>
        <div className={styles.dropdownContainer}>
          <select
            value={defaultSign}
            onChange={hanldeSelectChange}
            id="zodiac-signs"
            className={styles.zodiacSelect}
          >
            {zodiacSigns.map((sign, index) => (
              <option key={index} value={sign}>
                {sign}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.dropdownContainer}>
          <PrimaryText paddingBottom="10px" isSemiBold size_20>
            Horoscopes
          </PrimaryText>
          <ul id="horoscope-type" className={styles.horoscopes}>
            <Link to={`/horoscopes/daily-horoscope/${paramSign}`}>
              <li
                className={`${
                  horoscopeType.includes("daily") ? styles.active : ""
                }`}
              >
                Daily Horoscope
              </li>
            </Link>
            <Link to={`/horoscopes/weekly-horoscope/${paramSign}`}>
              <li
                className={`${
                  horoscopeType.includes("weekly") ? styles.active : ""
                }`}
              >
                Weekly Horoscope
              </li>
            </Link>
            <Link to={`/horoscopes/yearly-horoscope/${paramSign}`}>
              <li
                className={`${
                  horoscopeType.includes("yearly") ? styles.active : ""
                }`}
              >
                Yearly Horoscope
              </li>
            </Link>
            <Link to={`/horoscopes/todays-horoscope/${paramSign}`}>
              <li
                className={`${
                  horoscopeType.includes("todays") ? styles.active : ""
                }`}
              >
                Today's Horoscope
              </li>
            </Link>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
