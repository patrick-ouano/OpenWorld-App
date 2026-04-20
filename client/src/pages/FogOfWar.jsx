import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMap, TileLayer } from 'react-leaflet';
import {
  CELL_SIZE_METERS,
  REVEAL_RADIUS_METERS,
  cellKeyToLatLng,
  fetchExploredCells,
  getStoredAuthToken,
  getCellsInRadius,
  saveExploredCells,
} from '../lib/explorationProgress';

const SAVE_INTERVAL_MS = 15000;
const MAX_RENDERED_CELLS = 350;

function FogOfWar() {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const [paneReady, setPaneReady] = useState(false);
  const [exploredCells, setExploredCells] = useState([]);
  const pendingCellsRef = useRef(new Set());
  const exploredCellSetRef = useRef(new Set());

  useEffect(() => {
    exploredCellSetRef.current = new Set(exploredCells);
  }, [exploredCells]);

  // loads saved explored cells when fog first mounts
  useEffect(() => {
    let isMounted = true;

    async function loadCells() {
      const savedCells = await fetchExploredCells();
      if (!isMounted || !savedCells.length) return;
      setExploredCells(savedCells);
    }

    loadCells();
    return () => {
      isMounted = false;
    };
  }, []);

  // saves queued cells every few seconds instead of every gps update
  useEffect(() => {
    const timerId = setInterval(async () => {
      if (pendingCellsRef.current.size === 0) return;

      const cellsToSave = Array.from(pendingCellsRef.current);
      pendingCellsRef.current.clear();

      const saved = await saveExploredCells(cellsToSave);
      if (saved.length > 0) {
        setExploredCells(saved);
        return;
      }

      // puts cells back in queue when request fails
      cellsToSave.forEach((cell) => pendingCellsRef.current.add(cell));
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(timerId);
  }, []);

  // creates the reveal pane before first paint so tilelayer can use it
  useLayoutEffect(() => {
    if (!map.getPane('fogRevealPane')) {
      const pane = map.createPane('fogRevealPane');
      pane.style.zIndex = '250';
      // starts fully hidden until we have location data
      pane.style.clipPath = 'circle(0px at 0px 0px)';
    }
    setPaneReady(true);
  }, [map]);

  // watches user gps location
  // reference: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
  useEffect(() => {
    if (!navigator.geolocation) return;

    const onPosition = (geo) => {
      const lat = geo.coords.latitude;
      const lng = geo.coords.longitude;
      setPosition([lat, lng]);

      const cellsInRadius = getCellsInRadius(lat, lng, REVEAL_RADIUS_METERS, CELL_SIZE_METERS);
      if (!cellsInRadius.length) return;

      const newCells = cellsInRadius.filter((cell) => !exploredCellSetRef.current.has(cell));
      if (!newCells.length) return;

      newCells.forEach((cell) => {
        exploredCellSetRef.current.add(cell);
        if (getStoredAuthToken()) {
          pendingCellsRef.current.add(cell);
        }
      });

      setExploredCells((prev) => [...prev, ...newCells]);
    };
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(onPosition, () => {}, opts);
    const watchId = navigator.geolocation.watchPosition(onPosition, () => {}, opts);
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // converts meters to screen pixels at current zoom
  function metersToPixelsAt(lat, lng, meters) {
    const center = map.latLngToLayerPoint([lat, lng]);
    const edge = map.latLngToLayerPoint([lat + (meters / 111320), lng]);
    return Math.abs(center.y - edge.y);
  }

  // updates reveal mask whenever map moves or reveal data changes
  useEffect(() => {
    const pane = map.getPane('fogRevealPane');
    if (!pane) return;

    function updateRevealMask() {
      const gradients = [];
      const cellsToRender = exploredCells.slice(-MAX_RENDERED_CELLS);

      cellsToRender.forEach((cell) => {
        const latLng = cellKeyToLatLng(cell, CELL_SIZE_METERS);
        if (!latLng) return;

        const [lat, lng] = latLng;
        const point = map.latLngToLayerPoint([lat, lng]);
        const radiusPx = metersToPixelsAt(lat, lng, CELL_SIZE_METERS * 0.85);
        gradients.push(`radial-gradient(circle ${Math.round(radiusPx)}px at ${Math.round(point.x)}px ${Math.round(point.y)}px, white 98%, transparent 100%)`);
      });

      if (position) {
        const point = map.latLngToLayerPoint(position);
        const radiusPx = metersToPixelsAt(position[0], position[1], REVEAL_RADIUS_METERS);
        gradients.push(`radial-gradient(circle ${Math.round(radiusPx)}px at ${Math.round(point.x)}px ${Math.round(point.y)}px, white 98%, transparent 100%)`);
      }

      if (!gradients.length) {
        pane.style.clipPath = 'circle(0px at 0px 0px)';
        pane.style.maskImage = '';
        pane.style.webkitMaskImage = '';
        return;
      }

      // combines many circles into one mask for persistent reveal
      // reference: https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image
      const maskValue = gradients.join(', ');
      pane.style.clipPath = 'none';
      pane.style.maskImage = maskValue;
      pane.style.webkitMaskImage = maskValue;
      pane.style.maskRepeat = 'no-repeat';
      pane.style.webkitMaskRepeat = 'no-repeat';
    }

    updateRevealMask();
    map.on('move zoom viewreset', updateRevealMask);
    return () => map.off('move zoom viewreset', updateRevealMask);
  }, [map, position, exploredCells]);

  // renders color tiles only after pane exists
  if (!paneReady) return null;

  return (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      pane="fogRevealPane"
    />
  );
}

export default FogOfWar;
