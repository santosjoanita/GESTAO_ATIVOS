import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Correção para os ícones do Leaflet no React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapPicker = ({ onLocationSelect }) => {
  const [position, setPosition] = useState([41.5315, -8.7820]); // Centro de Esposende

  const LocationMarker = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);

        try {
          // Busca a morada real baseada nas coordenadas
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          
          // Envia a morada e coordenadas para o componente pai (EventoForm)
          onLocationSelect({
            address: data.display_name || `${lat}, ${lng}`,
            lat,
            lng
          });
        } catch (error) {
          console.error("Erro na geolocalização:", error);
        }
      },
    });

    return position ? <Marker position={position} /> : null;
  };

 return (
    <div 
      className="map-container-wrapper" 
      style={{ 
        height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden'
      }}
    >
      <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default MapPicker;