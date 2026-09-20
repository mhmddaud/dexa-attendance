import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Default center: Jakarta.
const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

interface GeoResult {
  displayName: string;
  lat: number;
  lon: number;
}

/** Handles map clicks to set the selected coordinate. */
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Recenters the map when the coordinate changes programmatically. */
function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [map, position]);
  return null;
}

/**
 * A clickable OpenStreetMap (Leaflet) picker with address search (Nominatim
 * geocoding). The user can:
 *  - search a place/address by name,
 *  - click the map to drop a pin,
 *  - or use their current GPS location.
 */
export function LocationPicker({
  latitude,
  longitude,
  onChange,
  height = 260,
}: LocationPickerProps) {
  const hasValue = latitude !== null && longitude !== null;
  const position: [number, number] | null = hasValue
    ? [latitude as number, longitude as number]
    : null;

  const [geoError, setGeoError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Close the results dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setGeoError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      const data = (await res.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
      }>;
      const mapped: GeoResult[] = data.map((d) => ({
        displayName: d.display_name,
        lat: Number(d.lat),
        lon: Number(d.lon),
      }));
      setResults(mapped);
      setShowResults(true);
      if (mapped.length === 0) {
        setGeoError('No places found for that search.');
      }
    } catch {
      setGeoError('Location search failed. Try again or click the map.');
    } finally {
      setSearching(false);
    }
  }

  function selectResult(r: GeoResult) {
    onChange(r.lat, r.lon);
    setShowResults(false);
    setQuery(r.displayName);
  }

  function useMyLocation() {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange(pos.coords.latitude, pos.coords.longitude),
      () => setGeoError('Unable to get your location. Pick a point on the map instead.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-2">
      {/* Search box */}
      <div className="relative" ref={searchBoxRef}>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch();
              }
            }}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search a place or address..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching}
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:bg-brand-300"
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>

        {showResults && results.length > 0 && (
          <ul className="absolute z-[1000] mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {results.map((r, i) => (
              <li key={`${r.lat}-${r.lon}-${i}`}>
                <button
                  type="button"
                  onClick={() => selectResult(r)}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {r.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-lg ring-1 ring-slate-200">
        <MapContainer
          center={position ?? DEFAULT_CENTER}
          zoom={position ? 16 : 12}
          style={{ height, width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <Recenter position={position} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">
          {hasValue
            ? `Selected: ${latitude?.toFixed(7)}, ${longitude?.toFixed(7)}`
            : 'Search, or click on the map to choose a location'}
        </span>
        <button
          type="button"
          onClick={useMyLocation}
          className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50"
        >
          Use my location
        </button>
      </div>
      {geoError && <p className="text-xs text-red-600">{geoError}</p>}
    </div>
  );
}
