// reference: I got a lot of help from Gemini when coming up
// for the integration and implementation of the fog of war,
// trying to understand how it works and making changes to
// personalize it.
// I also referenced other sources, which are mentioned in the code.

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import {
  CELL_SIZE_METERS,
  REVEAL_RADIUS_METERS,
  cellKeyToLatLng,
  fetchExploredCells,
  getStoredAuthToken,
  getCellsInRadius,
  saveExploredCells,
} from '../lib/explorationProgress';

export const REVEAL_RADIUS = REVEAL_RADIUS_METERS;
const SAVE_INTERVAL_MS = 15000;
const MAX_RENDERED_CELLS = 500;
const FOG_OPACITY = 0.78;

function FogOfWar({ exploredCells, setExploredCells }) {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const pendingCellsRef = useRef(new Set());
  const exploredCellSetRef = useRef(new Set());
  const positionRef = useRef(null);
  const cellsRef = useRef([]);
  const drawRef = useRef(null);

  useEffect(() => {
    exploredCellSetRef.current = new Set(exploredCells);
    cellsRef.current = exploredCells;
  }, [exploredCells]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

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

  // draws fog overlay and punches circular reveal holes
  // reference: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing
  useEffect(() => {
    // 1. Put the canvas in the overlayPane
    // We attach it here so it automatically stays underneath the pins (z-index 600) and popups (z-index 700).
    // This way, the dark fog doesn't accidentally cover up our markers!
    const pane = map.getPanes().overlayPane;
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    pane.appendChild(canvas);

    // converts meters to screen pixels at a given latitude
    function metersToPixelsAt(lat, meters) {
      const center = map.latLngToContainerPoint([lat, 0]);
      const edge = map.latLngToContainerPoint([lat + (meters / 111320), 0]);
      return Math.abs(center.y - edge.y);
    }

    function draw() {
      const size = map.getSize();
      if (canvas.width !== size.x) canvas.width = size.x;
      if (canvas.height !== size.y) canvas.height = size.y;

      // 2. Keep the canvas locked to the screen
      // Since the overlayPane moves around when the user drags the map, 
      // we have to push our canvas in the exact opposite direction so it stays glued to our viewport.
      const paneOffset = map.containerPointToLayerPoint([0, 0]);
      canvas.style.transform = `translate3d(${paneOffset.x}px, ${paneOffset.y}px, 0)`;

      const ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, size.x, size.y);
      ctx.fillStyle = `rgba(0, 0, 0, ${FOG_OPACITY})`;
      ctx.fillRect(0, 0, size.x, size.y);

      // 3. Punch out the fog
      // 'destination-out' is basically an eraser mode for the canvas. 
      // Any shape we draw now will literally erase the black fog we just drew, acting like a hole puncher.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000'; // solid black ensures it completely erases the fog 100%

      // 4. Draw all the holes at once
      // We group all the circles into one massive path and run ctx.fill() just once at the very end.
      // This stops the circles from drawing over each other's edges, which prevents gross overlapping lines!
      ctx.beginPath(); // start a single grouped drawing path

      const cells = cellsRef.current.slice(-MAX_RENDERED_CELLS);
      cells.forEach((cell) => {
        const latLng = cellKeyToLatLng(cell, CELL_SIZE_METERS);
        if (!latLng) return;
        const p = map.latLngToContainerPoint(latLng);
        const r = metersToPixelsAt(latLng[0], CELL_SIZE_METERS * 0.9);
        ctx.moveTo(p.x + r, p.y); // prevent stray lines by jumping manually
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      });

      if (positionRef.current) {
        const pos = positionRef.current;
        const p = map.latLngToContainerPoint(pos);
        const r = metersToPixelsAt(pos[0], REVEAL_RADIUS_METERS);
        ctx.moveTo(p.x + r, p.y);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      }

      ctx.fill(); // punch all circles in a single compositing step
    }

    drawRef.current = draw;
    draw();

    map.on('move zoom viewreset resize', draw);
    return () => {
      map.off('move zoom viewreset resize', draw);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      drawRef.current = null;
    };
  }, [map]);

  // redraws canvas whenever reveal data changes
  useEffect(() => {
    if (drawRef.current) drawRef.current();
  }, [position, exploredCells]);

  return null;
}

export default FogOfWar;
