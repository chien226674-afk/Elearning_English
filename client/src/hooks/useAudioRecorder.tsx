import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderProps {
  onStop: (blob: Blob) => void;
  silenceTimeoutMs?: number;
  silenceThreshold?: number;
  stopOnSilenceOnlyIfSpoken?: boolean;
  disableSilenceDetection?: boolean;
}

export function useAudioRecorder({ 
  onStop, 
  silenceTimeoutMs = 3000, 
  silenceThreshold = 30,
  stopOnSilenceOnlyIfSpoken = false,
  disableSilenceDetection = false
}: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const recordingStartTimeRef = useRef<number>(0);

  // AudioContext logic for silence detection - Export for WaveVisualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const hasSpokenRef = useRef(false);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      // Enforce minimum recording duration to avoid empty audio
      const elapsed = Date.now() - recordingStartTimeRef.current;
      if (elapsed < 500) {
        setTimeout(() => {
          if (mediaRecorderRef.current && isRecordingRef.current) {
            mediaRecorderRef.current.stop();
            isRecordingRef.current = false;
            setIsRecording(false);
          }
        }, 500 - elapsed);
      } else {
        mediaRecorderRef.current.stop();
        isRecordingRef.current = false;
        setIsRecording(false);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    }
  }, []);

  const checkSilence = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;

    if (average >= silenceThreshold) {
      hasSpokenRef.current = true;
      silenceStartRef.current = null;
    } else {
      // Only proceed with silence timeout if we don't care about hasSpoken, or if we do and they HAVE spoken.
      // AND only if manual disable flag is NOT set.
      if (!disableSilenceDetection && (!stopOnSilenceOnlyIfSpoken || hasSpokenRef.current)) {
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now();
        } else if (Date.now() - silenceStartRef.current > silenceTimeoutMs) {
          stopRecording();
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(checkSilence);
  }, [silenceThreshold, silenceTimeoutMs, stopRecording, stopOnSilenceOnlyIfSpoken, disableSilenceDetection]);

  const startRecording = async () => {
    if (isRecordingRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Always send the blob, even if it's small, to prevent the parent component from hanging in 'listening' state
        if (audioBlob.size > 0) {
          onStop(audioBlob);
        } else {
          // If literally 0 bytes, still ping onStop with empty blob
          onStop(new Blob([], { type: 'audio/webm' }));
        }
        
        // Cleanup stream
        stream.getTracks().forEach(track => track.stop());
      };

      recordingStartTimeRef.current = Date.now();
      mediaRecorderRef.current.start(250); // Capture chunks every 250ms
      isRecordingRef.current = true;
      setIsRecording(true);
      streamRef.current = stream;

      // Setup audio context for silence detection
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      silenceStartRef.current = null;
      hasSpokenRef.current = false;
      checkSilence();

    } catch (err) {
      console.error('Error starting audio recording:', err);
    }
    };

    return {
        isRecording,
        startRecording,
        stopRecording,
        analyser: analyserRef,
        stream: streamRef
    };
}
