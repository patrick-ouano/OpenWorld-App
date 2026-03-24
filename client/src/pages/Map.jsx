import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

function MapClickHandler({ draftPin, setDraftPin }) {
  useMapEvents({
    click: (e) => {
      // Don't create a pin if the user is typing in a form field
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (draftPin) {
        setDraftPin(null);
      } else {
        setDraftPin(e.latlng);
      }
    },
  });
  return null;
}

function Map() {
  const [draftPin, setDraftPin] = useState(null);
  const [pinName, setPinName] = useState('');
  const [pinCategory, setPinCategory] = useState('');
  const [pinDescription, setPinDescription] = useState('');
  const [landmarks, setLandmarks] = useState([]);

  // Fetch saved landmarks from the database
  const fetchLandmarks = async () => {
    const res = await fetch('http://localhost:5000/api/landmarks');
    const data = await res.json();
    setLandmarks(data);
  };

  useEffect(() => {
    fetchLandmarks();
  }, []);

  const handleCancel = () => {
    setDraftPin(null);
    setPinName('');
    setPinCategory('');
    setPinDescription('');
  };

  // Save a new landmark to the database
  const handleSave = async () => {
    const res = await fetch('http://localhost:5000/api/landmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: pinName,
        category: pinCategory,
        description: pinDescription,
        coordinates: { latitude: draftPin.lat, longitude: draftPin.lng },
      }),
    });
    if (res.ok) {
      setDraftPin(null);
      setPinName('');
      setPinCategory('');
      setPinDescription('');
      fetchLandmarks();
    }
  };

  // Delete a landmark from the database
  const deleteLandmark = async (id) => {
    const res = await fetch(`http://localhost:5000/api/landmarks/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      fetchLandmarks();
    }
  };

  const isFormValid =
    pinName.trim() !== '' &&
    pinCategory !== '' &&
    pinDescription.trim() !== '';

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
        <MapClickHandler draftPin={draftPin} setDraftPin={setDraftPin} />

        {/* Permanent landmarks from the database */}
        {landmarks.map((lm) => (
          <Marker key={lm._id} position={[lm.coordinates.latitude, lm.coordinates.longitude]}>
            <Popup>
              <h3>{lm.name}</h3>
              <span className="category-badge">{lm.category}</span>
              <p>{lm.description}</p>
              <button className="delete-pin-btn" onClick={() => deleteLandmark(lm._id)}>Delete Pin</button>
            </Popup>
          </Marker>
        ))}

        {/* Draft pin for creating a new landmark */}
        {draftPin && (
          <Marker position={draftPin}>
            <Popup className="admin-pin-popup" closeButton={false}>
              <h3>Create Landmark</h3>
              <input
                type="text"
                placeholder="Location Name"
                value={pinName}
                onChange={(e) => setPinName(e.target.value)}
              />
              <select
                value={pinCategory}
                onChange={(e) => setPinCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="Landmark">Landmark</option>
                <option value="Library">Library</option>
                <option value="Housing">Housing</option>
                <option value="Dining">Dining</option>
              </select>
              <textarea
                placeholder="Description"
                value={pinDescription}
                onChange={(e) => setPinDescription(e.target.value)}
              />
              <div className="popup-buttons">
                <button
                  className="save-btn"
                  disabled={!isFormValid}
                  onClick={handleSave}
                >
                  Save Pin
                </button>
                <button className="cancel-btn" onClick={(e) => { e.stopPropagation(); handleCancel(); }}>
                  Cancel
                </button>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default Map;
