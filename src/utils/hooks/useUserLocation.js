import { useState, useEffect } from "react";

const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.2090;
const DEFAULT_LOCATION = "Delhi, India";

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

    /*
      getCurrentPosition can throw *synchronously* in an in-app WebView.

      The error callback below only ever sees asynchronous failures — permission
      denied, position unavailable, timeout. It does not catch an exception raised
      by the call itself, and in an embedded Android WebView this call is not a
      browser API at all: it is proxied to native over the host app's injected JS
      bridge. When that bridge is stale — which is exactly what happens after the
      host app has been backgrounded and its Java objects collected — the call
      throws "Java object is gone" instead of invoking either callback.

      Unhandled, that exception escapes this effect: nothing sets `loaded`, so every
      consumer gating on it waits forever, and the throw itself surfaces as a
      JavaScript error that can take the app down.

      Defensive rather than incident-driven: no Clarity session has been traced to
      this specific call. The documented in-app bridge failures on this site carry
      the "error invoking postmessage:" prefix and come from the push/notification
      path (see the FCM note in App.jsx). This guard exists because geolocation is
      the other browser API we call that an embedded WebView proxies to native, and
      it was the one with no protection against a synchronous throw.

      The state already defaults to Delhi with `isDefault: true`, so settling
      `loaded` here degrades to the default location rather than to a dead page.
    */
    try {
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
    } catch (err) {
      // Bridge-proxied geolocation threw before either callback could run.
      // Settle on the default location so consumers stop waiting.
      console.warn("Geolocation unavailable in this browser:", err);
      setLocation((prev) => ({ ...prev, loaded: true }));
    }
  }, []);

  return location;
};

export default useUserLocation;
