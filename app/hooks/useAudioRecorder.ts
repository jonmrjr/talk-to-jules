'use client';

import { useState, useRef, useEffect } from 'react';
import { transcribeAudio, processWithGemini } from '../services/gemini';
import { JulesClient } from '../services/jules';
import { Interaction } from '../types';

type RecordingState = 'idle' | 'recording' | 'transcribing' | 'processing';

export const useAudioRecorder = (
  geminiApiKey: string,
  julesApiKey: string,
  defaultRepo: string,
  previousInteractions: Interaction[],
  onTranscriptionStart: (text: string) => string,
  onInteractionUpdate: (id: string, update: Partial<{ response: string; toolCalls: any[] }>) => void
) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(1000);
      setRecordingState('recording');
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setRecordingState('transcribing');
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    if (!geminiApiKey) {
      setError('Please configure your Gemini API key in settings');
      setRecordingState('idle');
      return;
    }
    try {
      const transcription = await transcribeAudio(audioBlob, geminiApiKey);
      if (!transcription) return;

      const interactionId = onTranscriptionStart(transcription);

      if (julesApiKey && defaultRepo) {
        const julesClient = new JulesClient(julesApiKey);
        const { text, toolCalls } = await processWithGemini(
          transcription,
          julesClient,
          geminiApiKey,
          defaultRepo,
          previousInteractions
        );
        onInteractionUpdate(interactionId, { response: text, toolCalls });
      }
      setRecordingState('idle');
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(`Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setRecordingState('idle');
    }
  };

  const processText = async (inputText: string) => {
    if (!geminiApiKey) {
      setError('Please configure your Gemini API key in settings');
      return;
    }
    if (!inputText.trim()) return;

    try {
      setRecordingState('processing');
      const interactionId = onTranscriptionStart(inputText);

      if (julesApiKey && defaultRepo) {
        const julesClient = new JulesClient(julesApiKey);
        const { text, toolCalls } = await processWithGemini(
          inputText,
          julesClient,
          geminiApiKey,
          defaultRepo,
          previousInteractions
        );
        onInteractionUpdate(interactionId, { response: text, toolCalls });
      }
      setRecordingState('idle');
    } catch (err) {
      console.error('Error processing text:', err);
      setError(`Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setRecordingState('idle');
    }
  };

  const handleButtonClick = () => {
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  return {
    recordingState,
    error,
    handleButtonClick,
    processText,
  };
};
