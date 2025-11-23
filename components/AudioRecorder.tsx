'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  geminiApiKey: string;
}

type RecordingState = 'idle' | 'recording' | 'transcribing';

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription, geminiApiKey }) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup on unmount
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

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(1000); // Collect data every second
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

  const transcribeAudio = async (audioBlob: Blob) => {
    if (!geminiApiKey) {
      setError('Please configure your Gemini API key in settings');
      setRecordingState('idle');
      return;
    }

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];

        // Call Gemini API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    text: "Please transcribe this audio accurately. Only return the transcription, nothing else."
                  },
                  {
                    inline_data: {
                      mime_type: audioBlob.type,
                      data: base64Data
                    }
                  }
                ]
              }]
            })
          }
        );

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Transcription failed');
        }

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const transcription = data.candidates[0].content.parts[0].text;
          onTranscription(transcription);
        } else {
          setError('No transcription received');
        }
        
        setRecordingState('idle');
      };

      reader.onerror = () => {
        setError('Failed to process audio');
        setRecordingState('idle');
      };
    } catch (err) {
      console.error('Error transcribing audio:', err);
      setError(`Transcription error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <button
        onClick={handleButtonClick}
        disabled={recordingState === 'transcribing'}
        className={`
          w-48 h-48 rounded-full font-bold text-white text-xl
          transition-all duration-300 shadow-2xl
          disabled:opacity-50 disabled:cursor-not-allowed
          ${recordingState === 'idle' 
            ? 'bg-blue-500 hover:bg-blue-600 active:scale-95' 
            : recordingState === 'recording'
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-gray-400'
          }
        `}
      >
        {recordingState === 'idle' && '🎤 Start Recording'}
        {recordingState === 'recording' && '⏹️ Stop Recording'}
        {recordingState === 'transcribing' && '⏳ Transcribing...'}
      </button>

      {error && (
        <div className="text-red-500 text-center max-w-md px-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
