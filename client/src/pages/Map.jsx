// react-leaflet setup from https://react-leaflet.js.org/docs/start-setup/
// geolocation api from https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import { apiUrl } from '../apiBase';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import FogOfWar, { REVEAL_RADIUS } from './FogOfWar';
import { cellKeyToLatLng, CELL_SIZE_METERS, toCellKey } from '../lib/explorationProgress';

// Helper to check if a pin sits inside any of the visually drawn holes
function isPinVisuallyRevealed(pinLat, pinLng, exploredCellSet) {
  // fast path: the pin's strictly enclosed cell is explored
  const exactKey = toCellKey(pinLat, pinLng, CELL_SIZE_METERS);
  if (exploredCellSet.has(exactKey)) return true;

  // fallback: check 3x3 neighbor grids to see if the pin sits physically inside 
  // the transparent hole of a neighboring cell.
  const latStep = CELL_SIZE_METERS / 111320;
  const lngStep = CELL_SIZE_METERS / (111320 * Math.cos((pinLat * Math.PI) / 180));

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const neighborKey = toCellKey(pinLat + dy * latStep, pinLng + dx * lngStep, CELL_SIZE_METERS);
      if (exploredCellSet.has(neighborKey)) {
        const center = cellKeyToLatLng(neighborKey, CELL_SIZE_METERS);
        if (center) {
          const dyMeters = (pinLat - center[0]) * 111320;
          const dxMeters = (pinLng - center[1]) * 111320 * Math.cos((center[0] * Math.PI) / 180);
          const distance = Math.sqrt(dxMeters * dxMeters + dyMeters * dyMeters);
          // 0.9 multiplier is exactly what FogOfWar uses to scale its hole
          if (distance <= CELL_SIZE_METERS * 0.9) return true;
        }
      }
    }
  }
  return false;
}

const UF_CENTER = [29.6436, -82.3549];

// pin colors: blue (in fog / not revealed), red (revealed circle, unanswered), orange (answered)
// Leaflet divIcon https://leafletjs.com/reference.html#divicon
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

// Leaflet default icon https://leafletjs.com/reference.html#icon-default
const defaultIcon = new L.Icon.Default();

function LocationMarker({ onPosition }) {
  const [position, setPosition] = useState(null);
  const hasPannedRef = useRef(false);
  // track last-reported position so we can throttle redundant state updates
  const lastPosRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const onSuccess = (pos) => {
      const { latitude, longitude } = pos.coords;

      // Geolocation throttle pattern from MDN https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
      const prev = lastPosRef.current;
      if (prev) {
        const dLat = Math.abs(latitude - prev.latitude);
        const dLng = Math.abs(longitude - prev.longitude);
        const now = Date.now();

        if (dLat < 0.00003 && dLng < 0.00003 && now - prev.ts < 2000) return;
      }
      lastPosRef.current = { latitude, longitude, ts: Date.now() };

      setPosition([latitude, longitude]);
      onPosition?.({ latitude, longitude });
    };
    const onErr = () => setPosition(null);

    // PositionOptions https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 };

    navigator.geolocation.getCurrentPosition(onSuccess, onErr, opts);
    // watchPosition https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
    const watchId = navigator.geolocation.watchPosition(onSuccess, onErr, opts);
    return () => navigator.geolocation.clearWatch(watchId);
  }, [onPosition]);

  if (!position) return null;

  return (
    <>
      {/* CircleMarker https://leafletjs.com/reference.html#circlemarker */}
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
  // useMapEvents https://react-leaflet.js.org/docs/api-map/#usemapevents
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

// Leaflet popupopen event https://leafletjs.com/reference.html#map-popupopen
// useRef pattern https://react.dev/reference/react/useRef
function PopupOpenDispatcher({ popupOpenSetters }) {
  // useMapEvents https://react-leaflet.js.org/docs/api-map/#usemapevents
  useMapEvents({
    popupopen: (e) => {
      // e.popup._source is the Leaflet layer that owns the popup
      const src = e.popup?._source?.getLatLng?.();
      if (!src) return;
      const setter = popupOpenSetters.current.get(`${src.lat},${src.lng}`);
      setter?.();
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
  popupOpenSetters,
}) {
  const map = useMap();
  const hasTrivia = !!triviaDoc;
  const shouldAutoOpenTrivia = !isAdmin && isNear && hasTrivia && !isCompleted;
  const [view, setView] = useState(() => (shouldAutoOpenTrivia ? 'trivia' : 'info'));
  const [submitting, setSubmitting] = useState(false);
  const [triviaError, setTriviaError] = useState('');

  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);

  const coordKey = `${lm.coordinates.latitude},${lm.coordinates.longitude}`;

  useEffect(() => {
    popupOpenSetters.current.set(coordKey, () => {
      setView(shouldAutoOpenTrivia ? 'trivia' : 'info');
    });
    return () => {
      popupOpenSetters.current.delete(coordKey);
    };
  }, [coordKey, shouldAutoOpenTrivia, popupOpenSetters]);

  // fetch https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
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
        setTriviaError(msg);
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
          <button className="save-btn trivia-try-again-btn" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setView('trivia'); }}>Try again</button>
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
        <div className="popup-buttons trivia-form-buttons">
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

function MapPage() {
  // per session. useMemo https://react.dev/reference/react/useMemo
  const { currentUser, isAdmin } = useMemo(() => {
    const userStr = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const cu = userStr ? JSON.parse(userStr) : null;
    return { currentUser: cu, isAdmin: cu?.role === 'Admin' };
  }, []);

  const [draftPin, setDraftPin] = useState(null);
  const [pinName, setPinName] = useState('');
  const [pinCategory, setPinCategory] = useState('');
  const [pinDescription, setPinDescription] = useState('');
  const [landmarks, setLandmarks] = useState([]);
  const [trivia, setTrivia] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [completedTriviaIds, setCompletedTriviaIds] = useState(
    () => new Set((currentUser?.completedTrivia ?? []).map((id) => String(id))),
  );
  const [exploredCells, setExploredCells] = useState([]);

  // useRef https://react.dev/reference/react/useRef
  const popupOpenSetters = useRef(new Map());

  // fetch https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  const fetchLandmarks = async () => {
    const res = await fetch(apiUrl('/api/landmarks'));
    const data = await res.json();
    setLandmarks(data);
  };

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

  const deleteLandmark = async (id) => {
    const res = await fetch(apiUrl(`/api/landmarks/${id}`), {
      method: 'DELETE',
    });
    if (res.ok) {
      fetchLandmarks();
      fetchTrivia();
    }
  };

  const handleCorrectAnswer = (triviaId, completedFromServer) => {
    const tid = String(triviaId);
    setCompletedTriviaIds((prev) => {
      const next = new Set([...prev].map((id) => String(id)));
      next.add(tid);
      return next;
    });

    // persist on the stored user so completedTrivia survives a page refresh
    const listFromServer = Array.isArray(completedFromServer)
      ? completedFromServer.map((id) => String(id))
      : null;
    const storageKey = 'authUser';
    const stored =
      localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const existing = (parsed.completedTrivia || []).map((id) => String(id));
      parsed.completedTrivia =
        listFromServer ?? Array.from(new Set([...existing, tid]));
      const target = localStorage.getItem(storageKey) ? localStorage : sessionStorage;
      target.setItem(storageKey, JSON.stringify(parsed));
      window.dispatchEvent(new Event('openworld-auth-user'));
    } catch {
      // ignore bad JSON
    }
  };

  // useMemo https://react.dev/reference/react/useMemo
  const triviaByCoord = useMemo(() => {
    const m = new Map();
    for (const t of trivia) {
      m.set(`${t.coordinates.latitude},${t.coordinates.longitude}`, t);
    }
    return m;
  }, [trivia]);

  // useCallback https://react.dev/reference/react/useCallback
  const findTriviaForPin = useCallback(
    (lm) => triviaByCoord.get(`${lm.coordinates.latitude},${lm.coordinates.longitude}`),
    [triviaByCoord]
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
        {/* OSM tile layer — tile URL from https://wiki.openstreetmap.org/wiki/Tile_servers
            attribution required by https://www.openstreetmap.org/copyright */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FogOfWar exploredCells={exploredCells} setExploredCells={setExploredCells} />
        <LocationMarker onPosition={setUserPos} />
        {/* Circle draws the fog reveal radius in admin view
            Leaflet Circle https://leafletjs.com/reference.html#circle */}
        {isAdmin && userPos && (
          <Circle
            center={[userPos.latitude, userPos.longitude]}
            radius={REVEAL_RADIUS}
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

        {/* single dispatcher handles popupopen for all pins in one listener */}
        <PopupOpenDispatcher popupOpenSetters={popupOpenSetters} />

        {/* permanent landmarks from db */}
        {useMemo(() => {
          const exploredSet = new Set(exploredCells);
          return landmarks.map((lm) => {
            const triviaDoc = findTriviaForPin(lm);
            
            // Fix merged from main: Using String() to prevent ID type mismatches
            const isCompleted = !!triviaDoc && completedTriviaIds.has(String(triviaDoc._id));
            
            const isExplored = isPinVisuallyRevealed(lm.coordinates.latitude, lm.coordinates.longitude, exploredSet);

            // "near" = inside fog reveal circle (same radius as FogOfWar REVEAL_RADIUS)
            const isNear =
              !!triviaDoc &&
              !isCompleted &&
              !!userPos &&
              L.latLng(userPos.latitude, userPos.longitude).distanceTo(
                L.latLng(lm.coordinates.latitude, lm.coordinates.longitude)
              ) <= REVEAL_RADIUS;

            const icon = isAdmin
              ? (triviaDoc ? completedIcon : defaultIcon)
              : (isCompleted ? completedIcon : isNear ? nearIcon : defaultIcon);

            return (
              <Marker
                key={lm._id}
                position={[lm.coordinates.latitude, lm.coordinates.longitude]}
                icon={icon}
                opacity={isExplored || isAdmin ? 1 : 0.45}
              >
                <Popup>
                  <div ref={(el) => {
                    if (el) {
                      const popupWrapper = el.closest('.leaflet-popup');
                      if (popupWrapper) {
                        if (isExplored || isAdmin) {
                          popupWrapper.classList.remove('dimmed-popup');
                        } else {
                          popupWrapper.classList.add('dimmed-popup');
                        }
                      }
                    }
                  }}>
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
                      popupOpenSetters={popupOpenSetters}
                    />
                  </div>
                </Popup>
              </Marker>
            );
          });
        }, [landmarks, exploredCells, isAdmin, completedTriviaIds, findTriviaForPin, handleCorrectAnswer, userPos, currentUser])}

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

export default MapPage;
