import { apiUrl } from '../apiBase';

export const REVEAL_RADIUS_METERS = 50;
export const CELL_SIZE_METERS = 25;

// reads token from local storage first and then session storage
export function getStoredAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

// returns current user id from storage
export function getStoredUserId() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const user = JSON.parse(raw || 'null');
    return user?.id || null;
  } catch {
    return null;
  }
}

// converts meters to latitude degrees
function metersToLatDegrees(meters) {
  return meters / 111320;
}

// converts meters to longitude degrees based on current latitude
function metersToLngDegrees(meters, latitude) {
  const latRad = (latitude * Math.PI) / 180;
  const metersPerDegree = 111320 * Math.cos(latRad);
  if (!metersPerDegree) return 0;
  return meters / metersPerDegree;
}

// turns a gps point into a grid cell key
export function toCellKey(lat, lng, cellSizeMeters = CELL_SIZE_METERS) {
  const latStep = metersToLatDegrees(cellSizeMeters);
  const lngStep = metersToLngDegrees(cellSizeMeters, lat);

  if (!latStep || !lngStep) return null;

  const latIndex = Math.floor(lat / latStep);
  const lngIndex = Math.floor(lng / lngStep);
  return `${latIndex}:${lngIndex}`;
}

// checks if a point is inside radius using simple meter conversion
function isWithinRadiusMeters(centerLat, centerLng, lat, lng, radiusMeters) {
  const dx = (lng - centerLng) * 111320 * Math.cos((centerLat * Math.PI) / 180);
  const dy = (lat - centerLat) * 111320;
  const distance = Math.sqrt((dx * dx) + (dy * dy));
  return distance <= radiusMeters;
}

// returns all grid cell keys inside a reveal radius
export function getCellsInRadius(lat, lng, radiusMeters = REVEAL_RADIUS_METERS, cellSizeMeters = CELL_SIZE_METERS) {
  const latStep = metersToLatDegrees(cellSizeMeters);
  const lngStep = metersToLngDegrees(cellSizeMeters, lat);
  if (!latStep || !lngStep) return [];

  const latRadiusDeg = metersToLatDegrees(radiusMeters);
  const lngRadiusDeg = metersToLngDegrees(radiusMeters, lat);

  const minLat = lat - latRadiusDeg;
  const maxLat = lat + latRadiusDeg;
  const minLng = lng - lngRadiusDeg;
  const maxLng = lng + lngRadiusDeg;

  const keys = [];

  for (let curLat = minLat; curLat <= maxLat; curLat += latStep) {
    for (let curLng = minLng; curLng <= maxLng; curLng += lngStep) {
      if (!isWithinRadiusMeters(lat, lng, curLat, curLng, radiusMeters)) continue;
      const key = toCellKey(curLat, curLng, cellSizeMeters);
      if (key) keys.push(key);
    }
  }

  return Array.from(new Set(keys));
}

// loads saved explored cells for current user
export async function fetchExploredCells() {
  const token = getStoredAuthToken();
  if (!token) return [];

  const res = await fetch(apiUrl('/api/exploration/me'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data.exploredCells) ? data.exploredCells : [];
}

// saves new explored cells for current user
export async function saveExploredCells(cells) {
  const token = getStoredAuthToken();
  if (!token || !Array.isArray(cells) || cells.length === 0) return [];

  const res = await fetch(apiUrl('/api/exploration/me'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cells }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data.exploredCells) ? data.exploredCells : [];
}
