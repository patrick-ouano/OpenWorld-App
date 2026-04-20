// react-leaflet setup from https://react-leaflet.js.org/docs/start-setup/
// geolocation api from https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import { apiUrl } from '../apiBase';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import FogOfWar from './FogOfWar';

const UF_CENTER = [29.6436, -82.3549];
const PROXIMITY_METERS = 100;

// pin colors are blue by default, red if in proximity but unanswered, and orange if answered
const nearIcon = L.divIcon({
  className: 'pin-near-icon',
  html: `<img src="${markerIconUrl}" class="pin-near-img" alt="" />`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const completedIcon = L.divIcon({
  className: 'pin-completed-icon',
  html: `<img src="${markerIconUrl}" class="pin-completed-img" alt="" />`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const defaultIcon = new L.Icon.Default();

function LocationMarker({ onPosition }) {
  const [position, setPosition] = useState(null);
  const hasPannedRef = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const onSuccess = (pos) => {
      const next = [pos.coords.latitude, pos.coords.longitude];
      setPosition(next);
      onPosition?.({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    };
    const onErr = () => setPosition(null);
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(onSuccess, onErr, opts);
    const watchId = navigator.geolocation.watchPosition(onSuccess, onErr, opts);
    return () => navigator.geolocation.clearWatch(watchId);
  }, [onPosition]);

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
      const target = e.originalEvent?.target;
      if (target && target.closest && target.closest('.leaflet-popup')) return;

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

function LandmarkPopup({
  lm,
  isAdmin,
  isNear,
  isCompleted,
  triviaDoc,
  currentUser,
  onCorrect,
  onDelete,
  onTriviaSaved,
}) {
  const map = useMap();
  const [view, setView] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  const hasTrivia = !!triviaDoc;

  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);

  // admins see the orange pin / proximity circle but never answer trivia
  const shouldAutoOpenTrivia = !isAdmin && isNear && hasTrivia && !isCompleted;

  // when this landmark's popup opens, auto-jump to the trivia view for explorers
  // standing next to an unanswered pin. matches the popup's source marker by
  // latlng so we don't react to other pins' popup events.
  useMapEvents({
    popupopen: (e) => {
      const srcLatLng = e.popup?._source?.getLatLng?.();
      if (
        srcLatLng &&
        srcLatLng.lat === lm.coordinates.latitude &&
        srcLatLng.lng === lm.coordinates.longitude
      ) {
        setView(shouldAutoOpenTrivia ? 'trivia' : 'info');
      }
    },
  });

  const handleAnswer = async (idx) => {
    if (submitting || !triviaDoc) return;
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/trivia/${triviaDoc._id}/answer`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          answerIndex: idx,
        }),
      });
      const data = await res.json();
      if (data.correct) {
        onCorrect(triviaDoc._id, data.completedTrivia);
        setView('info');
        map.closePopup();
      } else {
        setView('incorrect');
      }
    } catch {
      setView('incorrect');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAddTrivia = () => {
    setNewQuestion('');
    setNewOptions(['', '', '']);
    setNewCorrectIndex(0);
  };

  const [triviaError, setTriviaError] = useState('');

  const handleSaveTrivia = async () => {
    if (submitting) return;
    setSubmitting(true);
    setTriviaError('');
    try {
      let res;
      if (hasTrivia) {
        res = await fetch(apiUrl(`/api/trivia/${triviaDoc._id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: newQuestion.trim(),
            options: newOptions.map((o) => o.trim()),
            correctIndex: newCorrectIndex,
          }),
        });
      } else {
        res = await fetch(apiUrl('/api/trivia'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: {
              latitude: lm.coordinates.latitude,
              longitude: lm.coordinates.longitude,
            },
            question: newQuestion.trim(),
            options: newOptions.map((o) => o.trim()),
            correctIndex: newCorrectIndex,
          }),
        });
      }
      if (res.ok) {
        await onTriviaSaved();
        setView('info');
      } else {
        const body = await res.json().catch(() => ({}));
        const msg = body.error || `Server error ${res.status}`;
        setTriviaError(`${msg} (id: ${triviaDoc?._id ?? 'undefined'})`);
        console.error('[handleSaveTrivia]', res.status, body, 'id:', triviaDoc?._id);
      }
    } catch (err) {
      setTriviaError('Network error — check the server.');
      console.error('[handleSaveTrivia] fetch failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const canSaveTrivia =
    newQuestion.trim() !== '' && newOptions.every((o) => o.trim() !== '');

  if (view === 'trivia' && hasTrivia) {
    return (
      <>
        <p className="trivia-question">{triviaDoc.question}</p>
        <div className="trivia-options">
          {triviaDoc.options.map((opt, i) => (
            <button
              key={i}
              className="trivia-option-btn"
              disabled={submitting}
              onClick={() => handleAnswer(i)}
            >
              {opt}
            </button>
          ))}
        </div>
      </>
    );
  }

  if (view === 'incorrect') {
    return (
      <>
        <h3>{lm.name}</h3>
        <p className="trivia-incorrect">Incorrect, try again.</p>
        <div className="popup-buttons trivia-form-buttons">
          <button className="save-btn" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setView('trivia'); }}>Try again</button>
          <button className="cancel-btn" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setView('info'); }}>Back</button>
        </div>
      </>
    );
  }

  if (view === 'triviaForm') {
    return (
      <>
        <h3>{hasTrivia ? 'Edit Trivia' : 'Add Trivia'}</h3>
        <div className="trivia-admin-section">
          <textarea
            placeholder="Trivia question"
            maxLength={500}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          {newOptions.map((opt, i) => (
            <div key={i} className="trivia-admin-option-row">
              <input
                type="radio"
                name="trivia-correct"
                checked={newCorrectIndex === i}
                onChange={() => setNewCorrectIndex(i)}
                title="Mark as correct answer"
              />
              <input
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const next = [...newOptions];
                  next[i] = e.target.value;
                  setNewOptions(next);
                }}
              />
            </div>
          ))}
        </div>
        {triviaError && <p className="trivia-save-error">{triviaError}</p>}
        <div className="popup-buttons">
          <button
            className="save-btn"
            disabled={!canSaveTrivia || submitting}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleSaveTrivia(); }}
          >
            {submitting ? 'Saving…' : 'Save Trivia'}
          </button>
          <button
            className="cancel-btn"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setView('info'); }}
          >
            Cancel
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h3>{lm.name}</h3>
      <span className="category-badge">{lm.category}</span>
      <p>{lm.description}</p>
      {isAdmin && (
        <div className="popup-buttons">
          <button
            className="add-trivia-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (hasTrivia) {
                setNewQuestion(triviaDoc.question);
                setNewOptions([...triviaDoc.options]);
                setNewCorrectIndex(triviaDoc.correctIndex);
              } else {
                resetAddTrivia();
              }
              setView('triviaForm');
            }}
          >
            {hasTrivia ? 'Edit Trivia' : 'Add Trivia'}
          </button>
          <button
            className="delete-pin-btn"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(lm._id); }}
          >
            Delete Pin
          </button>
        </div>
      )}
    </>
  );
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
  const [trivia, setTrivia] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [completedTriviaIds, setCompletedTriviaIds] = useState(
    () => new Set(currentUser?.completedTrivia ?? [])
  );

  // fetches saved landmarks from the database
  const fetchLandmarks = async () => {
    const res = await fetch(apiUrl('/api/landmarks'));
    const data = await res.json();
    setLandmarks(data);
  };

  // fetches trivia entries (separate collection, joined to landmarks by coordinates)
  const fetchTrivia = async () => {
    const res = await fetch(apiUrl('/api/trivia'));
    const data = await res.json();
    setTrivia(data);
  };

  useEffect(() => {
    fetchLandmarks();
    fetchTrivia();
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
      handleCancel();
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

  // called by LandmarkPopup when the user answers correctly
  const handleCorrectAnswer = (triviaId, completedFromServer) => {
    setCompletedTriviaIds((prev) => {
      const next = new Set(prev);
      next.add(triviaId);
      return next;
    });

    // persist on the stored user so it survives a refresh
    const listFromServer = Array.isArray(completedFromServer) ? completedFromServer : null;
    const storageKey = 'authUser';
    const stored =
      localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      parsed.completedTrivia = listFromServer
        ?? Array.from(new Set([...(parsed.completedTrivia || []), triviaId]));
      const target = localStorage.getItem(storageKey) ? localStorage : sessionStorage;
      target.setItem(storageKey, JSON.stringify(parsed));
    } catch {
      // ignore bad JSON
    }
  };

  // find a Trivia doc that matches a landmark by exact coordinate equality
  const findTriviaForPin = (lm) =>
    trivia.find(
      (t) =>
        t.coordinates.latitude === lm.coordinates.latitude &&
        t.coordinates.longitude === lm.coordinates.longitude
    );

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
          className="fog-gray"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FogOfWar />
        <LocationMarker onPosition={setUserPos} />
        {isAdmin && userPos && (
          <Circle
            center={[userPos.latitude, userPos.longitude]}
            radius={PROXIMITY_METERS}
            pathOptions={{
              color: '#f26a21',
              weight: 2,
              dashArray: '6 6',
              fillColor: '#f26a21',
              fillOpacity: 0.08,
            }}
          />
        )}
        {isAdmin && <MapClickHandler draftPin={draftPin} setDraftPin={setDraftPin} />}

        {/* permanent landmarks from db */}
        {landmarks.map((lm) => {
          const triviaDoc = findTriviaForPin(lm);
          const isCompleted = !!triviaDoc && completedTriviaIds.has(triviaDoc._id);
          const distance = userPos
            ? L.latLng(userPos.latitude, userPos.longitude).distanceTo(
                L.latLng(lm.coordinates.latitude, lm.coordinates.longitude)
              )
            : Infinity;
          const isNear =
            userPos != null &&
            !!triviaDoc &&
            !isCompleted &&
            distance <= PROXIMITY_METERS;

          return (
            <Marker
              key={lm._id}
              position={[lm.coordinates.latitude, lm.coordinates.longitude]}
              icon={isCompleted ? completedIcon : isNear ? nearIcon : defaultIcon}
            >
              <Popup>
                <LandmarkPopup
                  lm={lm}
                  isAdmin={isAdmin}
                  isNear={isNear}
                  isCompleted={isCompleted}
                  triviaDoc={triviaDoc}
                  currentUser={currentUser}
                  onCorrect={handleCorrectAnswer}
                  onDelete={deleteLandmark}
                  onTriviaSaved={fetchTrivia}
                />
              </Popup>
            </Marker>
          );
        })}

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
                maxLength={500}
                value={pinDescription}
                onChange={(e) => setPinDescription(e.target.value)}
              />
              <small>{pinDescription.length}/500</small>
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
