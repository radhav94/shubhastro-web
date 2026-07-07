import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.shubhastro.ai";
const SITE_NAME = "ShubhAstro";
const LOGO_URL = `${SITE_URL}/images/ShubhAstrologo.png`;

/**
 * JsonLd — Injects structured data (JSON-LD) into the page head.
 * Directly manages script elements in the DOM (no Helmet dependency).
 */
const JsonLd = ({ pageTitle, pageDescription }) => {
  const { pathname } = useLocation();
  const currentUrl = `${SITE_URL}${pathname}`;
  const scriptRefs = useRef([]);

  useEffect(() => {
    // Clean up previous scripts
    scriptRefs.current.forEach((el) => el.remove());
    scriptRefs.current = [];

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: LOGO_URL,
      sameAs: [],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["English", "Hindi"],
      },
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/talk-to-astrologer?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };

    const breadcrumbSchema = buildBreadcrumb(pathname);
    const pageSchema = getPageSchema(pathname, currentUrl, pageTitle, pageDescription);

    const schemas = [organizationSchema, websiteSchema];
    if (breadcrumbSchema) schemas.push(breadcrumbSchema);
    if (pageSchema) schemas.push(pageSchema);

    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      scriptRefs.current.push(script);
    });

    return () => {
      scriptRefs.current.forEach((el) => el.remove());
      scriptRefs.current = [];
    };
  }, [pathname, pageTitle, pageDescription, currentUrl]);

  return null;
};

function buildBreadcrumb(pathname) {
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const items = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
  ];

  segments.forEach((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const name = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({
      "@type": "ListItem",
      position: index + 2,
      name,
      item: `${SITE_URL}${path}`,
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function getPageSchema(pathname, currentUrl, title, description) {
  if (pathname === "/") {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url: currentUrl,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      description: description || "AI Powered Astrology consultation platform with Kundli, Horoscope, Tarot readings and live astrologer consultations.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR", description: "Free Kundli, Horoscope & Tarot readings" },
    };
  }

  if (pathname.includes("talk-to-astrologer") || pathname.includes("chat-to-astrologer")) {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Talk to Astrologer",
      provider: { "@type": "Organization", name: SITE_NAME },
      serviceType: "Astrology Consultation",
      url: currentUrl,
      description: description || "Connect with expert astrologers for personalized consultations via chat, voice or video call.",
      areaServed: { "@type": "Country", name: "India" },
    };
  }

  if (pathname.includes("horoscope")) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title || "Daily Horoscope",
      url: currentUrl,
      publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: LOGO_URL } },
      description: description || "Get your daily, weekly, monthly and yearly horoscope predictions for all zodiac signs.",
    };
  }

  if (pathname.includes("kundli") || pathname.includes("free-kundli")) {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Free Kundli Generator",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      url: currentUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      description: description || "Generate your free Vedic birth chart (Kundli) with detailed planetary positions, dasha analysis and predictions.",
    };
  }

  if (pathname.includes("tarot")) {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Tarot Card Reading",
      provider: { "@type": "Organization", name: SITE_NAME },
      serviceType: "Tarot Reading",
      url: currentUrl,
      description: description || "Get free tarot card readings - daily tarot, love tarot, yes/no tarot and more.",
    };
  }

  if (pathname.includes("numerology")) {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Numerology",
      provider: { "@type": "Organization", name: SITE_NAME },
      serviceType: "Numerology Analysis",
      url: currentUrl,
      description: description || "Discover your life path number, destiny number and more with our numerology calculator.",
    };
  }

  if (pathname.includes("match-making") || pathname.includes("compatibility")) {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Kundli Matching",
      provider: { "@type": "Organization", name: SITE_NAME },
      serviceType: "Matchmaking",
      url: currentUrl,
      description: description || "Check Kundli matching and zodiac compatibility with detailed Ashtakoot analysis.",
    };
  }

  if (pathname.includes("panchang")) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title || "Today's Panchang",
      url: currentUrl,
      publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: LOGO_URL } },
      description: description || "Today's Panchang with Tithi, Nakshatra, Yoga, Karana and auspicious timings.",
    };
  }

  if (pathname.includes("calculator")) {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: title || "Astrology Calculator",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      url: currentUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      description: description || "Free astrology and numerology calculators.",
    };
  }

  if (pathname.includes("blog")) {
    return {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "ShubhAstro Blog",
      url: currentUrl,
      publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: LOGO_URL } },
      description: description || "Astrology articles, tips and insights from expert astrologers.",
    };
  }

  if (pathname.includes("ai-wow") || pathname.includes("palmistry") || pathname.includes("face-reading") || pathname.includes("signature-analysis") || pathname.includes("aura")) {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: title || "AI Astrology Tools",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      url: currentUrl,
      description: description || "AI-powered astrology tools including palmistry scanner, face reading, signature analysis and aura photography.",
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title || SITE_NAME,
    url: currentUrl,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    description: description || "AI Powered Astrology, Kundli & Horoscope platform.",
  };
}

export default JsonLd;
