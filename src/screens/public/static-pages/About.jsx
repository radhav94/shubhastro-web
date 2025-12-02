import React from 'react';
import styles from "./StaticPages.module.scss";

const About = () => {
  return (
    <div className={styles.aboutUsContainer}>
      {/* Banner Section with Image and Stats */}
      <section className={styles.bannerSection}>
        <img 
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
          alt="Our Team" 
          className={styles.bannerImage}
        />
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <h2 className={styles.statNumber}>4.3 Lakh+</h2>
            <p className={styles.statLabel}>Happy customers</p>
          </div>
          <div className={styles.statItem}>
            <h2 className={styles.statNumber}>1300+</h2>
            <p className={styles.statLabel}>Astrologers</p>
          </div>
          <div className={styles.statItem}>
            <h2 className={styles.statNumber}>20+</h2>
            <p className={styles.statLabel}>Countries</p>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className={styles.contentSection}>
        <div className={styles.container}>
          <h1 className={styles.mainHeading}>WHO WE ARE</h1>
          <p className={styles.paragraph}>
            Shubhtalk is the best astrology website for online Astrology predictions. With a gigantic pool of 1300+ Vedic astrologers, Tarot readers, Numerologists, Vastu experts and more, Shubhtalk lets you connect with these experts over call and chat and get answers to all your problems.
          </p>
          <p className={styles.paragraph}>
            From Kundli matching to Kundli predictions, on Shubhtalk, the visitor is to get the best future predictions across aspects like Marriage, Love, Career or Health and more. When using Shubhtalk, you can trust us for highly accurate, precise and well researched astrological content that would offset most of your worries.
          </p>
        </div>
      </section>

      {/* What We Do Section with Image */}
      <section className={styles.whatWeDoSection}>
        <div className={styles.container}>
          <div className={styles.twoColumnLayout}>
            <div className={styles.imageColumn}>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Astrology Services" 
                className={styles.contentImage}
              />
            </div>
            <div className={styles.textColumn}>
              <h2 className={styles.sectionTitle}>What We Do</h2>
              <p className={styles.paragraph}>
                Shubhtalk brings together astrologers and their boundless knowledge about the occult science of Astrology on one platform and lets you connect with them 24*7. Apart from the best future predictions that help you get through the difficult phase of life, Shubhtalk also offers Free Live astrology sessions, Daily horoscope, Free kundli matching service, Spiritual store and much more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Vision Section */}
      <section className={styles.missionVisionSection}>
        <div className={styles.container}>
          <div className={styles.twoColumnLayout}>
            <div className={styles.missionColumn}>
              <div className={styles.missionBox}>
                <h2 className={styles.sectionTitle}>MISSION</h2>
                <p className={styles.paragraph}>
                  Our mission is to create a community for the people who seek astrological guidance for the betterment of life. We want to help out people who are going through a bad phase of life in the most trusted way.
                </p>
              </div>
            </div>
            <div className={styles.visionColumn}>
              <div className={styles.visionBox}>
                <h2 className={styles.sectionTitle}>VISION</h2>
                <p className={styles.paragraph}>
                  Our vision is to provide astrological solutions to the customers who are facing problems. We want to give direction to their life with the assistance of our trusted and certified astrologers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* We Got Your Back Section with Image */}
      <section className={styles.weGotYourBackSection}>
        <div className={styles.container}>
          <div className={styles.twoColumnLayoutReverse}>
            <div className={styles.textColumn}>
              <h2 className={styles.sectionTitle}>WE GOT YOUR BACK</h2>
              <p className={styles.paragraph}>
                At Shubhtalk, all of the astrologers, along with the support team, work in amalgamation as one family to ensure you the best astrology experience. Whether you are a teen stressing over what career field to choose or an adult facing compatibility issues in marriage, Shubhtalk helps all find guidance, direction and happiness in life.
              </p>
            </div>
            <div className={styles.imageColumn}>
              <img 
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Support Team" 
                className={styles.contentImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className={styles.ourStorySection}>
        <div className={styles.container}>
          <h2 className={styles.mainHeading}>OUR STORY</h2>
          <p className={styles.paragraph}>
            Shubhtalk came into being with an aim to not only keep the ethos of traditional astrology intact but to also amalgamate in it the solutions to modern problems like mental health, stress, depression, etc. With that being the first and foremost goal, Shubhtalk's founder, Shubham Kumar, has not only worked to deliver the best of Vedic astrology on the platform but has touched every aspect of mental wellness through spiritual means. With the grace of God, Shubhtalk, over the years, has not only been able to achieve the aforementioned aim but also add-on to the list of 'achieved goals' and continues to do so. Today, with over 13000 astrologers onboard and over 1 Lakh minutes of daily consultation, Shubhtalk, besides allowing you to talk to the best astrologers, also provides numerous other services like Free live sessions, Free Kundli matching, Daily horoscope and much more.
          </p>
          <p className={styles.paragraph}>
            As Shubhtalk continues to grow with each passing day, so is growing our potential and urge to offer the best of astrology to our users. We are working to build the world's largest community of spiritual and wellbeing experts, and we hope you become a part of this journey one prediction at a time.
          </p>
        </div>
      </section>

      {/* Why Shubhtalk Section */}
      <section className={styles.whyShubhtalkSection}>
        <div className={styles.container}>
          <h2 className={styles.mainHeading}>WHY SHUBHTALK</h2>
          <p className={styles.paragraph}>
            Shubhtalk today enjoys a strong audience across 10+ countries with a growing pool of 500+ skilled Vedic astrologers, Tarot readers, Numerologists, and Vastu experts from around the world. As we understand how one seeks only accurate predictions for themselves, we ensure every astrologer you connect with on our platform is truly among the best. For this purpose, we let users rate the astrologers and recommend to you only the ones who maintain a 4+ rating. This way, we assure you of premium-quality predictions. This is one of the reasons why we have built a base of over 5-lakh customers and are currently doing around 5,000 minutes of daily consultation. Also, another core goal for us is to respect your privacy so you can trust us and certainly buzz about us.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;