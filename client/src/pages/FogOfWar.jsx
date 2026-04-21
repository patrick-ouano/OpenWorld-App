import { useEffect, useState, useLayoutEffect } from 'react';
import { useMap, TileLayer } from 'react-leaflet';

// How many meters around the user to show in full color (shared with Map.jsx pin proximity)
export const REVEAL_RADIUS = 200;

/** @param {{ revealAt: { latitude: number; longitude: number } | null }} props — same source as LocationMarker / admin Circle */
function FogOfWar({ revealAt }) {
  const map = useMap();
  const [paneReady, setPaneReady] = useState(false);

  // Create the "reveal" pane BEFORE first paint (useLayoutEffect)
  // so the TileLayer can safely render into it
  useLayoutEffect(() => {
    let pane = map.getPane('fogRevealPane');
    if (!pane) {
      pane = map.createPane('fogRevealPane');
      pane.style.zIndex = '250';
      // Start fully hidden until we know where the user is
      pane.style.clipPath = 'circle(0px at 0px 0px)';
    }
    pane.style.display = '';
    setPaneReady(true);
  }, [map]);

  // Hide the reveal pane when fog preview unmounts so no empty high-z pane sits above the map
  useEffect(() => {
    return () => {
      const pane = map.getPane('fogRevealPane');
      if (pane) {
        pane.style.display = 'none';
        pane.style.clipPath = 'none';
      }
    };
  }, [map]);

  // Clip uses the same position as LocationMarker / pin logic — do not use a second geolocation
  // subscription or the reveal circle stays at 0px (whole map dark) while userPos is already set.
  useEffect(() => {
    if (!revealAt) return;
    const pane = map.getPane('fogRevealPane');
    if (!pane) return;

    const position = [revealAt.latitude, revealAt.longitude];

    function updateClip() {
      const center = map.latLngToLayerPoint(position);

      // Convert REVEAL_RADIUS (meters) to pixels at the current zoom
      // 1 degree of latitude ≈ 111,320 meters
      const degOffset = REVEAL_RADIUS / 111320;
      const edge = map.latLngToLayerPoint([position[0] + degOffset, position[1]]);
      const radiusPx = Math.abs(center.y - edge.y);

      pane.style.clipPath = `circle(${radiusPx}px at ${center.x}px ${center.y}px)`;
    }

    updateClip();
    map.on('move zoom viewreset', updateClip);
    return () => map.off('move zoom viewreset', updateClip);
  }, [map, revealAt?.latitude, revealAt?.longitude]);

  // Only render the color TileLayer after the pane exists
  if (!paneReady) return null;

  return (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      pane="fogRevealPane"
    />
  );
}

export default FogOfWar;
