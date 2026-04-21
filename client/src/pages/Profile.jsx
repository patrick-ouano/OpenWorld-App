// Profile map + discoveries use react-leaflet: https://react-leaflet.js.org/docs/start-introduction/
// Badge strip reuses ../lib/badgeProgress.js (same logic as Badges.jsx).
// useMemo: https://react.dev/reference/react/useMemo
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { PLANNED_CHALLENGE_COUNT } from '../data/badges';
import { CHALLENGES } from '../data/challenges';
import { apiUrl } from '../apiBase';
import {
  countFullyCompleted,
  evaluateChallenges,
  getCompletedTriviaIds,
  getRecentUnlockedBadges,
} from '../lib/badgeProgress';
import { getProfileDisplayName } from '../lib/userDisplayName';
import 'leaflet/dist/leaflet.css';
import './Profile.css';

const UF_CENTER = [29.6436, -82.3549];
const MAP_ZOOM = 14;

const FOG_STORAGE_KEY = 'openworld_fog_pct';
const PROFILE_BADGE_SLOTS = 4;

function readFogPercent() {
  try {
    const raw = localStorage.getItem(FOG_STORAGE_KEY);
    if (raw == null) return 35;
    const n = Number(raw);
    if (!Number.isFinite(n)) return 35;
    return Math.min(100, Math.max(0, Math.round(n)));
  } catch {
    return 35;
  }
}

function sortLandmarksRecent(landmarks) {
  return [...landmarks].sort((a, b) => String(b._id).localeCompare(String(a._id)));
}

function readAuthUser() {
  try {
    const raw =
      localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ProfileMiniMap({ landmarks }) {
  return (
    <MapContainer
      center={UF_CENTER}
      zoom={MAP_ZOOM}
      minZoom={12}
      maxZoom={17}
      scrollWheelZoom={false}
      dragging
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {landmarks.map((lm) => (
        <Marker key={lm._id} position={[lm.coordinates.latitude, lm.coordinates.longitude]}>
          <Popup>
            <strong>{lm.name}</strong>
            {lm.category ? (
              <>
                {' '}
                · {lm.category}
              </>
            ) : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function Profile() {
  const [landmarks, setLandmarks] = useState([]);
  const [trivia, setTrivia] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [fogPct, setFogPct] = useState(() => readFogPercent());
  const [authUser, setAuthUser] = useState(() => readAuthUser());
  const [completedTriviaIds, setCompletedTriviaIds] = useState(() =>
    getCompletedTriviaIds(),
  );

  useEffect(() => {
    const onStorage = () => setFogPct(readFogPercent());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const syncAuth = () => setAuthUser(readAuthUser());
    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('focus', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('focus', syncAuth);
    };
  }, []);

  useEffect(() => {
    const syncTrivia = () => setCompletedTriviaIds(getCompletedTriviaIds());
    syncTrivia();
    window.addEventListener('storage', syncTrivia);
    window.addEventListener('openworld-auth-user', syncTrivia);
    return () => {
      window.removeEventListener('storage', syncTrivia);
      window.removeEventListener('openworld-auth-user', syncTrivia);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lmRes, trRes] = await Promise.all([
          fetch(apiUrl('/api/landmarks')),
          fetch(apiUrl('/api/trivia')),
        ]);
        const lmData = await lmRes.json();
        const trData = await trRes.json();
        if (!cancelled) {
          setLandmarks(Array.isArray(lmData) ? lmData : []);
          setTrivia(Array.isArray(trData) ? trData : []);
          setLoadState('ok');
        }
      } catch {
        if (!cancelled) setLoadState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recent = useMemo(() => sortLandmarksRecent(landmarks).slice(0, 5), [landmarks]);

  const progressMap = useMemo(
    () => evaluateChallenges(CHALLENGES, landmarks, trivia, completedTriviaIds),
    [landmarks, trivia, completedTriviaIds],
  );

  const fullyCompleted = useMemo(
    () => countFullyCompleted(progressMap),
    [progressMap],
  );

  const profileBadgeSlots = useMemo(() => {
    const earned = getRecentUnlockedBadges(fullyCompleted, PROFILE_BADGE_SLOTS);
    const slots = earned.map((b) => ({ key: b.id, earned: true, badge: b }));
    while (slots.length < PROFILE_BADGE_SLOTS) {
      slots.push({ key: `empty-${slots.length}`, earned: false });
    }
    return slots;
  }, [fullyCompleted]);

  const displayName = useMemo(
    () => getProfileDisplayName(authUser),
    [authUser],
  );
  const usernameHandle = String(authUser?.username ?? '').trim().replace(/^@+/, '');

  return (
    <div className="profile-page">
      {/* whole profile sits on one grid — if you shuffle these blocks around, tweak .profile-align-grid in Profile.css too (I had the map column drift when top/bottom weren’t the same grid) */}
      <div className="profile-inner profile-align-grid">
        <section className="profile-identity-wide" aria-label="Profile overview">
          <div className="profile-identity-top">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-inner" aria-hidden>
                🗺️
              </div>
            </div>

            <div className="profile-name-fog">
              <h1 className="profile-display-name">{displayName}</h1>
              {usernameHandle ? (
                <p className="profile-username-meta" aria-label="Username">
                  @{usernameHandle}
                </p>
              ) : null}
              <div className="profile-fog-inline">
                <div className="profile-fog-labels">
                  <span>Fog of war revealed</span>
                  <strong>{fogPct}%</strong>
                </div>
                <div
                  className="profile-progress-track profile-progress-track--thin"
                  role="progressbar"
                  aria-valuenow={fogPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="profile-progress-fill" style={{ width: `${fogPct}%` }} />
                </div>
              </div>
            </div>
          </div>
          <p className="profile-tagline">Map the campus · Collect discoveries</p>
        </section>

        <aside className="profile-badges-column" aria-label="Most recent badges">
          <h2 className="profile-badges-heading">Most recent badges</h2>
          <p className="profile-badges-hint">
            {fullyCompleted}/{PLANNED_CHALLENGE_COUNT} challenges complete (same as Badges).
          </p>
          <div className="profile-badge-grid">
            {profileBadgeSlots.map((slot) =>
              slot.earned ? (
                <div
                  key={slot.badge.id}
                  className="profile-badge-slot profile-badge-slot--has-badge"
                  title={slot.badge.blurb}
                >
                  <span className="profile-badge-slot__abbr">{slot.badge.abbr}</span>
                  <span className="profile-badge-slot__cap">{slot.badge.name}</span>
                </div>
              ) : (
                <div
                  key={slot.key}
                  className="profile-badge-slot profile-badge-slot--placeholder"
                  title="Earn badges by completing map trivia challenges"
                >
                  <span className="profile-badge-slot__abbr">—</span>
                  <span className="profile-badge-slot__cap">Locked</span>
                </div>
              ),
            )}
          </div>
        </aside>

        {/* not strictly necessary but the gap between the cards and the map felt “blank”; this is just a hairline */}
        <div className="profile-row-divider" aria-hidden />

        <div className="profile-map-panel">
          <div className="profile-panel-header">Campus preview</div>
          <div className="profile-map-wrap">
            {loadState === 'loading' ? (
              <p className="profile-loading">Loading map…</p>
            ) : loadState === 'error' ? (
              <p className="profile-loading">Could not load map.</p>
            ) : (
              <ProfileMiniMap landmarks={landmarks} />
            )}
          </div>
        </div>

        <div className="profile-discoveries-panel">
          <div className="profile-panel-header">Most recent discoveries</div>
          <div className="profile-discoveries-body">
            {loadState === 'error' ? (
              <p className="profile-empty">Could not load discoveries.</p>
            ) : recent.length === 0 ? (
              <p className="profile-empty">Landmarks you add on the map will show up here.</p>
            ) : (
              recent.map((lm) => (
                <div key={lm._id} className="profile-discovery-row">
                  <span className="profile-discovery-dot" aria-hidden />
                  <div>
                    <h3>{lm.name}</h3>
                    <p>{lm.description || 'No description yet.'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
