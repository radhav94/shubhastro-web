import { PrimaryText, Title } from "../../../../../component";
import { AppImages } from "../../../../../utils/appImages";

import Styles from "./Services.module.scss";

const images = [
  AppImages.KundaliRead,
  AppImages.Marriage,
  AppImages.Love,
  AppImages.Vastu,
];

const servicesData = [
  { id: 1, title: "Kundli", image: images[0] },
  { id: 2, title: "Tarot Reading", image: images[1] },
  { id: 3, title: "Palmistry", image: images[2] },
  { id: 4, title: "Numerology", image: images[3] },
  { id: 5, title: "Horoscope", image: images[1] },
  { id: 6, title: "Vedic Astrology", image: images[2] },
  { id: 7, title: "Matchmaking", image: images[3] },
  { id: 8, title: "Career Guidance", image: images[1] },
  { id: 9, title: "Love Astrology", image: images[2] },
  { id: 10, title: "Health Astrology", image: images[0] },
  { id: 11, title: "Wealth Astrology", image: images[1] },
  { id: 12, title: "Daily Predictions", image: images[0] },
];

const Services = () => {
  return (
    <div>
      <Title title="Free Astrology Services" />

      <div className={Styles.servicesGrid}>
        {servicesData.map((service) => (
          <div key={service.id} className={Styles.serviceCard}>
            <img
              src={service.image}
              alt={service.title}
              className={Styles.serviceImage}
            />
            <PrimaryText isCenter isBold size_14>
              {service.title}
            </PrimaryText>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;
