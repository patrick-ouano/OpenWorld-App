import { useEffect, useState, useLayoutEffect } from 'react';
import { useMap, TileLayer } from 'react-leaflet';

// How many meters around the user to show in full color (shared with Map.jsx pin proximity)
export const REVEAL_RADIUS = 200;

function FogOfWar() {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const [paneReady, setPaneReady] = useState(false);

  // Create the "reveal" pane BEFORE first paint (useLayoutEffect)
  // so the TileLayer can safely render into it
  useLayoutEffect(() => {
    if (!map.getPane('fogRevealPane')) {
      const pane = map.createPane('fogRevealPane');
      pane.style.zIndex = '250';
      // Start fully hidden until we know where the user is
      pane.style.clipPath = 'circle(0px at 0px 0px)';
    }
    setPaneReady(true);
  }, [map]);

  // Watch the user's GPS position
  useEffect(() => {
    if (!navigator.geolocation) return;

    const onPosition = (geo) => {
      setPosition([geo.coords.latitude, geo.coords.longitude]);
    };
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(onPosition, () => {}, opts);
    const watchId = navigator.geolocation.watchPosition(onPosition, () => {}, opts);
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Update the clip circle whenever the map moves/zooms or user moves
  useEffect(() => {
    if (!position) return;
    const pane = map.getPane('fogRevealPane');
    if (!pane) return;

    function updateClip() {
      // Convert the user's GPS position to pixel coords in the pane
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
  }, [map, position]);

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
