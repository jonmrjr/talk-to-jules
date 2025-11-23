'use client';

import React from 'react';
import { useAudioRecorder } from '../app/hooks/useAudioRecorder';
import { Interaction } from '../app/types';

interface AudioRecorderProps {
  onTranscriptionStart: (text: string) => string;
  onInteractionUpdate: (id: string, update: Partial<{ response: string; toolCalls: any[] }>) => void;
  geminiApiKey: string;
  julesApiKey: string;
  defaultRepo: string;
  previousInteractions?: Interaction[];
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscriptionStart,
  onInteractionUpdate,
  geminiApiKey,
  julesApiKey,
  defaultRepo,
  previousInteractions = [],
}) => {
  const { recordingState, error, handleButtonClick } = useAudioRecorder(
    geminiApiKey,
    julesApiKey,
    defaultRepo,
    previousInteractions,
    onTranscriptionStart,
    onInteractionUpdate
  );

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
        {recordingState === 'transcribing' && '⏳ Processing...'}
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
