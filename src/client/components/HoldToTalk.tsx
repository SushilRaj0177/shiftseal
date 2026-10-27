import React, { useState, useRef } from 'react';
import type { Language } from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';

interface HoldToTalkProps {
  lang: Language;
  onRecorded: (audioBase64: string, mimeType: string) => void;
  disabled?: boolean;
}

export const HoldToTalk: React.FC<HoldToTalkProps> = ({ lang, onRecorded, disabled }) => {
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setMicError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Microphone not available on this browser. Use a 1-tap sample or type below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = String(reader.result || '');
          const commaIdx = res.indexOf(',');
          const b64 = commaIdx >= 0 ? res.slice(commaIdx + 1) : res;
          if (b64.length > 0) {
            onRecorded(b64, mimeType);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setMicError('Microphone permission denied. Use a 1-tap sample or type below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button
        type="button"
        className={recording ? 'btn-danger' : 'btn-primary'}
        disabled={disabled}
        onClick={() => (recording ? stopRecording() : startRecording())}
        style={{ width: '100%', minHeight: '52px', fontSize: '15px' }}
      >
        <span aria-hidden="true">{recording ? '⏹️' : '🎙️'}</span>
        <span>{recording ? t(lang, 'recordingReleaseToSend') : t(lang, 'holdToTalk')}</span>
      </button>
      {micError && (
        <p role="status" style={{ fontSize: '12px', color: 'var(--warning)' }}>
          {micError}
        </p>
      )}
    </div>
  );
};
