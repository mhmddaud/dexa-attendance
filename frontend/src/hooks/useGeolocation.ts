import { useCallback, useState } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Wrapper around the browser Geolocation API. Exposes a `request` action that
 * resolves the current position, and surfaces a clear error when permission is
 * denied so the caller can block attendance submission.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
  });

  const request = useCallback((): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const msg = 'Geolocation is not supported by this browser';
        setState((s) => ({ ...s, error: msg }));
        reject(new Error(msg));
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setState({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            loading: false,
            error: null,
          });
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          const msg =
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied. Please enable GPS to submit attendance.'
              : 'Unable to retrieve your location.';
          setState((s) => ({ ...s, loading: false, error: msg }));
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }, []);

  return { ...state, request };
}
