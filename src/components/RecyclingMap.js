import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import "../styles/RecyclingMap.css";

const RecyclingMap = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  const [zoom, setZoom] = useState(4);
  const [markers, setMarkers] = useState([]);
  const [filteredMarkers, setFilteredMarkers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filters, setFilters] = useState({
    electronics: true,
    batteries: true,
    appliances: true,
    popular: true,
  });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const googleMapsApiKey = "AIzaSyAnJxROJPEdjxHcaXvgKfW3QqPP42znV5g";
  const mapContainerStyle = { height: "100%", width: "100%" };

  const generateNearbyCenters = (centerCoords, locationName) => {
    const count = Math.floor(Math.random() * 5) + 8;
    const types = [
      "Electronics Recycling",
      "E-Waste Collection",
      "Tech Recycling",
    ];
    const streets = ["Green St", "Eco Rd", "Recycle Ave", "Sustainable Way"];

    return Array.from({ length: count }, (_, i) => {
      const offsetLat = (Math.random() - 0.5) * 0.05;
      const offsetLng = (Math.random() - 0.5) * 0.05;
      return {
        id: `center-${Date.now()}-${i}`,
        name: `${locationName} ${types[i % types.length]} ${i + 1}`,
        position: {
          lat: centerCoords.lat + offsetLat,
          lng: centerCoords.lng + offsetLng,
        },
        address: `${Math.floor(Math.random() * 1000) + 1} ${
          streets[i % streets.length]
        }`,
        phone: `+44 20 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(
          1000 + Math.random() * 9000
        )}`,
        hours: ["Mon-Fri: 9AM-5PM", "Mon-Sat: 8AM-6PM"][i % 2],
        website: "https://example.com",
        types: ["electronics", "batteries", "appliances"].filter(
          () => Math.random() > 0.5
        ),
        distance: (Math.random() * 5 + 0.5).toFixed(1),
      };
    });
  };

  useEffect(() => {
    const filtered = markers.filter((m) =>
      Object.keys(filters).some((f) => filters[f] && m.types.includes(f))
    );
    setFilteredMarkers(filtered.length ? filtered : markers);
  }, [filters, markers]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSuggestionSelect = (sug) => {
    const newCenter = { lat: parseFloat(sug.lat), lng: parseFloat(sug.lon) };
    const newMarkers = generateNearbyCenters(
      newCenter,
      sug.display_name.split(",")[0]
    );

    setMapCenter(newCenter);
    setZoom(14);
    setMarkers(newMarkers);
    setSuggestions([]);
    setSearchQuery(sug.display_name);
    setHasSearched(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const first = data[0];
        const center = {
          lat: parseFloat(first.lat),
          lng: parseFloat(first.lon),
        };
        const newMarkers = generateNearbyCenters(
          center,
          first.display_name.split(",")[0]
        );

        setMapCenter(center);
        setZoom(14);
        setMarkers(newMarkers);
        setSuggestions([]);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    setHasSearched(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const newMarkers = generateNearbyCenters(coords, "Your Location");

        setMapCenter(coords);
        setZoom(14);
        setMarkers(newMarkers);
        setLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Could not get your location.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="container">
      <h2 className="title">E-Waste Recycling Centers</h2>
      <div className="grid">
        {/* MAP */}
        <div className="map-container">
          <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={zoom}
              options={{
                styles: [
                  {
                    featureType: "poi.business",
                    stylers: [{ visibility: "off" }],
                  },
                  {
                    featureType: "water",
                    elementType: "geometry.fill",
                    stylers: [{ color: "#d3d3d3" }],
                  },
                  {
                    featureType: "poi.park",
                    elementType: "geometry.fill",
                    stylers: [{ color: "#e6f7e1" }],
                  },
                ],
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }}
            >
              {filteredMarkers.map((m) => (
                <Marker
                  key={m.id}
                  position={m.position}
                  onClick={() => setSelectedMarker(m)}
                  icon={{
                    url: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
                    scaledSize: new window.google.maps.Size(25, 41),
                    origin: new window.google.maps.Point(0, 0),
                    anchor: new window.google.maps.Point(12, 41),
                  }}
                />
              ))}
              {selectedMarker && (
                <InfoWindow
                  position={selectedMarker.position}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="info-window-content">
                    <h3 className="popup-title">{selectedMarker.name}</h3>
                    <p>{selectedMarker.address}</p>
                    <p>
                      <Phone size={14} /> {selectedMarker.phone}
                    </p>
                    <p>
                      <Clock size={14} /> {selectedMarker.hours}
                    </p>
                    {selectedMarker.website && (
                      <a
                        href={selectedMarker.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="center-button"
                      >
                        <ExternalLink size={14} /> Visit Website
                      </a>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </div>

        {/* SIDEBAR */}
        <div className="info-section">
          <div className="search-box">
            <div className="search-title">
              <span>Find Recycling Centers</span>
            </div>
            <div className="search-input-group">
              <input
                type="text"
                className="search-input"
                placeholder="Enter city or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button className="search-button" onClick={handleSearch}>
                Search
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="suggestions-list">
                {suggestions.map((sug) => (
                  <div
                    key={sug.place_id}
                    className="suggestion-item"
                    onClick={() => handleSuggestionSelect(sug)}
                  >
                    {sug.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="filters-box">
            <div className="filters-title">
              <span>Filter Centers</span>
            </div>
            <div className="filters-options">
              {["electronics", "batteries", "appliances", "popular"].map(
                (type) => (
                  <label key={type} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={filters[type]}
                      onChange={(e) =>
                        setFilters({ ...filters, [type]: e.target.checked })
                      }
                    />
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="external-link-box">
            <button
              onClick={() => window.open("https://store.croma.com/", "_blank")}
              className="external-store-button"
            >
              <ExternalLink size={16} className="mr-2" /> Locate Croma Store
            </button>
          </div>

          <div className="stats-box">
            <div className="stat-card">
              <div className="stat-value">{filteredMarkers.length}</div>
              <div className="stat-label">Centers Found</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {filteredMarkers.length
                  ? (
                      filteredMarkers.reduce(
                        (sum, m) => sum + parseFloat(m.distance),
                        0
                      ) / filteredMarkers.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <div className="stat-label">Avg Distance (km)</div>
            </div>
          </div>

          <div className="centers-list">
            {loading ? (
              <div className="summary-box">Loading centers...</div>
            ) : hasSearched ? (
              filteredMarkers.length ? (
                filteredMarkers.map((c) => (
                  <div
                    key={c.id}
                    className="center-card"
                    onClick={() => {
                      setSelectedMarker(c);
                      setMapCenter(c.position);
                    }}
                  >
                    <div className="center-info">
                      <MapPin className="icons" size={20} />
                      <div>
                        <h3 className="center-name">{c.name}</h3>
                        <p className="center-address">{c.address}</p>
                        <p className="center-phone">
                          <Phone size={14} /> {c.phone}
                        </p>
                        <p className="center-phone">
                          <Clock size={14} /> {c.hours}
                        </p>
                        {c.website && (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="center-button"
                          >
                            <ExternalLink size={14} /> Visit Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="summary-box">
                  <span className="summary-text">
                    No centers match your filters. Try adjusting filters or
                    searching another area.
                  </span>
                </div>
              )
            ) : (
              <div className="summary-box">
                <span className="summary-text">
                  Start by searching a location or{" "}
                  <button
                    onClick={getUserLocation}
                    className="use-location-button"
                  >
                    use your current location
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecyclingMap;
