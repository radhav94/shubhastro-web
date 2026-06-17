import { useState, useEffect } from "react";

const DEFAULT_LAT = 21.1458;
const DEFAULT_LON = 79.0882;
const DEFAULT_LOCATION = "Nagpur, India";

const useUserLocation = () => {
  // Get language from googtrans cookie
  const getLang = () => {
    const cookie = document.cookie.split("; ").find((row) => row.startsWith("googtrans="));
    if (cookie) {
      const value = decodeURIComponent(cookie.split("=")[1]);
      const parts = value.split("/").filter(Boolean);
      return parts.length > 1 ? parts[1] : "en";
    }
    return "en";
  };

  const currentLang = getLang();

  const [location, setLocation] = useState({
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
    locationName: currentLang === "en" ? DEFAULT_LOCATION : "",
    isDefault: true,
    loaded: false,
  });

  useEffect(() => {
    // Fetch localized default location name
    if (currentLang !== "en") {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}&format=json&zoom=10&accept-language=${currentLang}`
      )
        .then((res) => res.json())
        .then((data) => {
          const city = data?.address?.city || data?.address?.town || data?.address?.state_district || "";
          const country = data?.address?.country || "";
          const name = [city, country].filter(Boolean).join(", ");
          if (name) {
            setLocation((prev) => ({ ...prev, locationName: name }));
          }
        })
        .catch(() => {});
    }

    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, loaded: true }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          lat: latitude,
          lon: longitude,
          locationName: "Your Location",
          isDefault: false,
          loaded: true,
        });

        // Get language from googtrans cookie for localized place names
        const lang = getLang();

        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&accept-language=${lang}`
        )
          .then((res) => res.json())
          .then((data) => {
            const city =
              data?.address?.city ||
              data?.address?.town ||
              data?.address?.village ||
              data?.address?.state_district ||
              "";
            const state = data?.address?.state || "";
            const country = data?.address?.country || "";
            const name = [city, state, country].filter(Boolean).join(", ");
            if (name) {
              setLocation((prev) => ({ ...prev, locationName: name }));
            }
          })
          .catch(() => {});
      },
      () => {
        setLocation((prev) => ({ ...prev, loaded: true }));
      },
      { timeout: 5000, maximumAge: 0 }
    );
  }, []);

  return location;
};

export default useUserLocation;
