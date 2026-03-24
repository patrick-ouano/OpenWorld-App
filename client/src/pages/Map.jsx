import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

const UF_CENTER = [29.6436, -82.3549];

function LocationMarker() {
  const [position, setPosition] = useState(null);
  const hasPannedRef = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('[GPS] Geolocation API not available in this browser');
      return;
    }

    console.log('[GPS] Requesting location permission...');

    const onSuccess = (pos) => {
      const coords = [pos.coords.latitude, pos.coords.longitude];
      console.log('[GPS] Position acquired:', coords);
      setPosition(coords);
    };
    const onErr = (err) => {
      console.error('[GPS] Error:', err.code, err.message);
      setPosition(null);
    };
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(onSuccess, onErr, opts);
    const watchId = navigator.geolocation.watchPosition(onSuccess, onErr, opts);
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!position) {
    console.log('[GPS] No position yet, blue dot not rendered');
    return null;
  }

  return (
    <>
      <CircleMarker
        center={position}
        radius={12}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#3388ff',
          fillOpacity: 1,
          weight: 3,
        }}
      />
      <PanToUser position={position} hasPannedRef={hasPannedRef} />
    </>
  );
}

function PanToUser({ position, hasPannedRef }) {
  const map = useMap();
  useEffect(() => {
    if (!position || hasPannedRef.current) return;
    map.flyTo(position, 16, { duration: 1.5 });
    hasPannedRef.current = true;
  }, [map, position, hasPannedRef]);
  return null;
}

function MapDebugger() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const { offsetWidth, offsetHeight } = container;
    console.log('[MAP] Container dimensions:', offsetWidth, 'x', offsetHeight);
    if (offsetHeight === 0) {
      console.error('[MAP] Container height is 0 — map will NOT display. Check CSS.');
    } else {
      console.log('[MAP] Map is rendering correctly.');
    }
    map.invalidateSize();
  }, [map]);
  return null;
}

function ZoomLogger() {
  useMapEvents({
    zoomend: (e) => console.log('Zoom level:', e.target.getZoom()),
  });
  return null;
}

function Map() {
  return (
    <div className="map-page">
      <MapContainer
        center={UF_CENTER}
        zoom={15}
        minZoom={13}
        maxZoom={18}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
        <ZoomLogger />
        <MapDebugger />
      </MapContainer>
    </div>
  );
}

export default Map;
