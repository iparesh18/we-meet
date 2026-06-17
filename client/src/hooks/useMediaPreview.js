import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Manages a getUserMedia preview for the join page, with independent camera
 * and mic toggles. Tracks are released on unmount so LiveKit can claim the
 * devices when the student actually joins.
 */
export function useMediaPreview({ initialCam = true, initialMic = true } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camOn, setCamOn] = useState(initialCam);
  const [micOn, setMicOn] = useState(initialMic);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  const attach = useCallback(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      stream.getVideoTracks().forEach((t) => (t.enabled = camOn));
      stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
      attach();
      setReady(true);
    } catch (e) {
      setReady(false);
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
        setError('Camera/microphone permission was denied. You can still join with them off.');
      } else if (e && e.name === 'NotFoundError') {
        setError('No camera/microphone found. You can still join with them off.');
      } else {
        setError('Could not access camera/microphone. You can still join with them off.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attach]);

  const stop = useCallback(() => {
    const stream = streamRef.current;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
  }, []);

  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-attach whenever the <video> (re)mounts — on first ready and each time the
  // camera is toggled back on (the element unmounts while the camera is off).
  useEffect(() => {
    if (ready && camOn) attach();
  }, [ready, camOn, attach]);

  useEffect(() => {
    const s = streamRef.current;
    if (s) s.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [camOn]);

  useEffect(() => {
    const s = streamRef.current;
    if (s) s.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);

  return {
    videoRef,
    camOn,
    micOn,
    setCamOn,
    setMicOn,
    toggleCam: () => setCamOn((v) => !v),
    toggleMic: () => setMicOn((v) => !v),
    error,
    ready,
    restart: start,
    stop,
  };
}
