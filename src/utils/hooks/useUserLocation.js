import { useState, useEffect } from "react";

const DEFAULT_LAT = 19.132;
const DEFAULT_LON = 72.342;
const DEFAULT_LOCATION = "Mumbai, India";

const useUserLocation = () => {
  const [location, setLocation] = useState({
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
    locationName: DEFAULT_LOCATION,
    isDefault: true,
    loaded: false,
  });

  useEffect(() => {
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

        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
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
