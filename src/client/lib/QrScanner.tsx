import React, { useEffect, useRef, useState } from 'react';

/** Pulls a site token out of a scanned QR (a check-in link or a bare token). */
export function tokenFromScan(text: string): string | null {
  const raw = text.includes('#') ? text.slice(text.indexOf('#') + 1) : text;
  return /^ss1\.[rp]\./.test(raw) ? raw : null;
}

/** Pulls an invite code out of a scanned join link. */
export function inviteFromScan(text: string): string | null {
  const m = /[?&]code=([A-Za-z0-9-]{5,32})/.exec(text);
  return m ? m[1].toUpperCase() : null;
}

interface Props {
  /** Returns the value to use, or null if this QR is not the right kind. */
  parse(text: string): string | null;
  onResult(value: string): void;
  onError(message: string): void;
  hint: string;
}

type Detector = { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };

/** Camera QR scanner. Uses the built-in BarcodeDetector where available, jsQR otherwise. */
export const QrScanner: React.FC<Props> = ({ parse, onResult, onError, hint: initialHint }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hint, setHint] = useState(initialHint);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer = 0;
    const canvas = document.createElement('canvas');

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      } catch {
        onError('Camera permission is needed to scan the gate code.');
        return;
      }
      const video = videoRef.current;
      if (!video || stopped) return;
      video.srcObject = stream;
      await video.play().catch(() => undefined);

      const Native = (window as { BarcodeDetector?: new (o: object) => Detector }).BarcodeDetector;
      const detector: Detector | null = Native ? new Native({ formats: ['qr_code'] }) : null;
      const jsQR = detector ? null : (await import('jsqr')).default;

      const tick = async () => {
        if (stopped || !video.videoWidth) {
          timer = window.setTimeout(tick, 200);
          return;
        }
        let text: string | null = null;
        if (detector) {
          const codes = await detector.detect(video).catch(() => []);
          text = codes[0]?.rawValue ?? null;
        } else if (jsQR) {
          const w = 480;
          const h = Math.round((video.videoHeight / video.videoWidth) * w);
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
          ctx.drawImage(video, 0, 0, w, h);
          text = jsQR(ctx.getImageData(0, 0, w, h).data, w, h)?.data ?? null;
        }
        if (text) {
          const value = parse(text);
          if (value) {
            onResult(value);
            return;
          }
          setHint('That is not the right code. Try the other one on the poster.');
        }
        timer = window.setTimeout(tick, 150);
      };
      void tick();
    })();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [parse, onResult, onError]);

  return (
    <div className="stack">
      <div className="scanner">
        <video ref={videoRef} muted playsInline aria-label="Camera preview" />
        <div className="scanner-frame" aria-hidden="true" />
      </div>
      <p className="t-caption muted center" role="status">
        {hint}
      </p>
    </div>
  );
};
