import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';



delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SearchControl = ({ onResultSelect }) => {
  const map = useMap();

  useEffect(() => {
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
    })
    .on('markgeocode', function (e) {
      const latlng = e.geocode.center;
      map.setView(latlng, 16);
      onResultSelect(latlng); 
    })
    .addTo(map);

    return () => map.removeControl(geocoder);
  }, [map, onResultSelect]);

  return null;
};


const MapPicker = ({ onLocationSelect }) => {
 
  const [position, setPosition] = useState([41.5315, -8.7820]);
  const markerRef = useRef(null);


  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      const address = data.display_name || `${lat}, ${lng}`;
      
      if (onLocationSelect) {
        onLocationSelect({ address, lat, lng });
      }
      return address;
    } catch (error) {
      console.error("Erro ao obter morada:", error);
      return `${lat}, ${lng}`;
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        fetchAddress(lat, lng);
      },
    });
    return null;
  };

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
          fetchAddress(lat, lng);
        }
      },
    }),
    []
  );

  const handleSearchResult = (latlng) => {
    setPosition([latlng.lat, latlng.lng]);
    fetchAddress(latlng.lat, latlng.lng);
  };

  return (
    <div className="map-container-wrapper" style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
        
        {/* Controlos */}
        <SearchControl onResultSelect={handleSearchResult} />
    
        <MapClickHandler />

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satélite (Google)">
            <TileLayer
              url="http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              attribution='&copy; Google Maps'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Mapa de Rua (OSM)">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <Marker 
            draggable={true} 
            eventHandlers={eventHandlers} 
            position={position} 
            ref={markerRef}
        >
            <Popup>Arrasta-me para ajustar a localização!</Popup>
        </Marker>

      </MapContainer>
    </div>
  );
};

export default MapPicker;