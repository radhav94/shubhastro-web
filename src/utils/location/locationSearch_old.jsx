import React, { useRef } from "react";
import { useJsApiLoader, StandaloneSearchBox } from "@react-google-maps/api";

const libraries = ["places"];

const LocationSearch = ({ value, onChange, onPlaceSelect }) => {
  const searchBoxRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const onPlacesChanged = () => {
    if (searchBoxRef.current) {
      const places = searchBoxRef.current.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        const address = place.formatted_address;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onPlaceSelect({ address, lat, lng });
      }
    }
  };

  const inputStyle = {
    boxSizing: `border-box`,
    border: `1px solid #e0e0e0`,
    width: `100%`,
    height: `50px`,
    padding: `0 12px`,
    borderRadius: `8px`,
    fontSize: `16px`,
    outline: `none`,
  };

  if (loadError) {
    return (
      <input
        type="text"
        value="Could not load map search."
        style={inputStyle}
        disabled
      />
    );
  }

  if (!isLoaded) {
    return (
      <input
        type="text"
        value="Loading Map Search..."
        style={inputStyle}
        disabled
      />
    );
  }

  return (
    <StandaloneSearchBox
      onLoad={(ref) => (searchBoxRef.current = ref)}
      onPlacesChanged={onPlacesChanged}
    >
      <input
        type="text"
        placeholder="Search for a city..."
        value={value} // Controlled by the parent's state
        onChange={onChange} // The parent's handleInputChange function
        style={inputStyle}
      />
    </StandaloneSearchBox>
  );
};

export default LocationSearch;
