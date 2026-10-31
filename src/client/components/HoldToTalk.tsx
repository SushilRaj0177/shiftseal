import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.js';
import { useLang } from '../i18n/LangProvider.js';

interface Props {
  onRecorded(audioBase64: string, mimeType: string): void;
  disabled?: boolean;
  /** A round mic with a short hint, for use inside a composer bar. */
  compact?: boolean;
}

/** Press and hold to record a voice note; release to send it. */
export const HoldToTalk: React.FC<Props> = ({ onRecorded, disabled, compact }) => {
  const { t } = useLang();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!recording) return;
    setSeconds(0);
    const started = Date.now();
    const id = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(id);
  }, [recording]);

  // Never leave the microphone open if the screen goes away mid-recording,
  // and do not send what was half-said.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (recorder.current?.state === 'recording') recorder.current.stop();
    };
  }, []);

  const start = async () => {
    if (disabled || recording) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType });
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = String(reader.result ?? '').split(',')[1] ?? '';
          if (b64 && alive.current) onRecorded(b64, mimeType);
        };
        reader.readAsDataURL(new Blob(chunks.current, { type: mimeType }));
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError('Microphone permission is needed to record. You can type instead.');
    }
  };

  const stop = () => {
    if (!recording) return;
    recorder.current?.stop();
    setRecording(false);
  };

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const handlers = {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onKeyDown: (e: React.KeyboardEvent) =>
      (e.key === ' ' || e.key === 'Enter') && !e.repeat && (e.preventDefault(), void start()),
    onKeyUp: (e: React.KeyboardEvent) => (e.key === ' ' || e.key === 'Enter') && stop(),
  };

  if (compact)
    return (
      <div className={`talk${recording ? ' recording' : ''}`}>
        <button
          type="button"
          className="talk-btn"
          disabled={disabled}
          aria-pressed={recording}
          aria-label={recording ? t('releaseToSend') : t('holdToTalk')}
          {...handlers}
        >
          <Icon name={recording ? 'stop' : 'mic'} size={22} />
        </button>
        <span className={`talk-hint${error ? ' c-warn' : ''}`} role="status" aria-live="polite">
          {error ??
            (recording ? (
              <>
                <span className="talk-dot" aria-hidden="true" />
                <span className="t-number">{clock}</span> {t('releaseToSend')}
              </>
            ) : (
              t('holdToTalk')
            ))}
        </span>
      </div>
    );

  return (
    <div className="stack-sm">
      <button
        type="button"
        className={`mic-bar${recording ? ' recording' : ''}`}
        disabled={disabled}
        aria-pressed={recording}
        {...handlers}
      >
        <span className="tile">
          <Icon name={recording ? 'stop' : 'mic'} />
        </span>
        <span>{recording ? `${clock} · ${t('releaseToSend')}` : t('holdToTalk')}</span>
      </button>
      {error && (
        <p className="t-caption c-warn" role="status">
          {error}
        </p>
      )}
    </div>
  );
};
