// react-leaflet setup from https://react-leaflet.js.org/docs/start-setup/
// geolocation api from https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { apiUrl } from '../apiBase';
import 'leaflet/dist/leaflet.css';
import './Map.css';

const UF_CENTER = [29.6436, -82.3549];

function LocationMarker() {
  const [position, setPosition] = useState(null);
  const hasPannedRef = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const onSuccess = (pos) => {
      setPosition([pos.coords.latitude, pos.coords.longitude]);
    };
    const onErr = () => setPosition(null);
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(onSuccess, onErr, opts);
    const watchId = navigator.geolocation.watchPosition(onSuccess, onErr, opts);
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!position) return null;

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

function MapClickHandler({ draftPin, setDraftPin }) {
  useMapEvents({
    click: (e) => {
      // clicking map while typing in popup was creating pins - this fixes it
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
  const userStr = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'Admin';

  const [draftPin, setDraftPin] = useState(null);
  const [pinName, setPinName] = useState('');
  const [pinCategory, setPinCategory] = useState('');
  const [pinDescription, setPinDescription] = useState('');
  const [landmarks, setLandmarks] = useState([]);

  // fetches saved landmarks from the database
  const fetchLandmarks = async () => {
    const res = await fetch(apiUrl('/api/landmarks'));
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

  // saves a new landmark to the database
  const handleSave = async () => {
    const res = await fetch(apiUrl('/api/landmarks'), {
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

  // deletes a landmark from the database
  const deleteLandmark = async (id) => {
    const res = await fetch(apiUrl(`/api/landmarks/${id}`), {
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
        {isAdmin && <MapClickHandler draftPin={draftPin} setDraftPin={setDraftPin} />}

        {/* permanent landmarks from db */}
        {landmarks.map((lm) => (
          <Marker key={lm._id} position={[lm.coordinates.latitude, lm.coordinates.longitude]}>
            <Popup>
              <h3>{lm.name}</h3>
              <span className="category-badge">{lm.category}</span>
              <p>{lm.description}</p>
              {isAdmin && <button className="delete-pin-btn" onClick={() => deleteLandmark(lm._id)}>Delete Pin</button>}
            </Popup>
          </Marker>
        ))}

        {/* draft pin for creating new landmark */}
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
