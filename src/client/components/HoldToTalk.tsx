import React, { useRef, useState } from 'react';
import { Icon } from './Icon.js';
import { useLang } from '../i18n/LangProvider.js';

interface Props {
  onRecorded(audioBase64: string, mimeType: string): void;
  disabled?: boolean;
}

/** Press and hold to record a voice note; release to send it. */
export const HoldToTalk: React.FC<Props> = ({ onRecorded, disabled }) => {
  const { t } = useLang();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

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
          if (b64) onRecorded(b64, mimeType);
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

  return (
    <div className="stack-sm">
      <button
        type="button"
        className={`mic-bar${recording ? ' recording' : ''}`}
        disabled={disabled}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && start()}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
        aria-pressed={recording}
      >
        <span className="tile">
          <Icon name={recording ? 'stop' : 'mic'} />
        </span>
        <span>{recording ? t('releaseToSend') : t('holdToTalk')}</span>
      </button>
      {error && (
        <p className="t-caption c-warn" role="status">
          {error}
        </p>
      )}
    </div>
  );
};
