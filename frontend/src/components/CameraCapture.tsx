import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';

interface CameraCaptureProps {
  /** Called when the user confirms a captured photo. */
  onCapture: (photo: Blob, previewUrl: string) => void;
  /** Called when the user retakes / clears a previously confirmed photo. */
  onClear?: () => void;
}

/**
 * Reusable camera component using the MediaDevices API.
 * Handles opening the camera, previewing the live stream, capturing a still,
 * retaking, and confirming. The stream is always stopped on unmount.
 */
export function CameraCapture({ onCapture, onClear }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActive(false);
  }, []);

  // Always stop the camera stream when the component unmounts.
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const openCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      setError(
        'Unable to access the camera. Please grant camera permission and try again.',
      );
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCaptured(url);
        stopStream();
        onCapture(blob, url);
      },
      'image/jpeg',
      0.9,
    );
  }, [onCapture, stopStream]);

  const retake = useCallback(() => {
    if (captured) URL.revokeObjectURL(captured);
    setCaptured(null);
    onClear?.();
    void openCamera();
  }, [captured, onClear, openCamera]);

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}

      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
        {captured ? (
          <img
            src={captured}
            alt="Captured"
            className="h-full w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
        )}
        {!active && !captured && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">
            Camera is off
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!active && !captured && (
          <Button type="button" onClick={openCamera}>
            Open Camera
          </Button>
        )}
        {active && !captured && (
          <>
            <Button type="button" onClick={capture}>
              Capture
            </Button>
            <Button type="button" variant="secondary" onClick={stopStream}>
              Stop
            </Button>
          </>
        )}
        {captured && (
          <Button type="button" variant="secondary" onClick={retake}>
            Retake
          </Button>
        )}
      </div>
    </div>
  );
}
