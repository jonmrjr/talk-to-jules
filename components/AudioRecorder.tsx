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
  const { recordingState, error, handleButtonClick, processText } = useAudioRecorder(
    geminiApiKey,
    julesApiKey,
    defaultRepo,
    previousInteractions,
    onTranscriptionStart,
    onInteractionUpdate
  );

  const [inputText, setInputText] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      processText(inputText);
      setInputText('');
    }
  };

  const isProcessing = recordingState === 'transcribing' || recordingState === 'processing';

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md">
      <button
        onClick={handleButtonClick}
        disabled={isProcessing}
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
        {isProcessing && '⏳ Processing...'}
      </button>

      <div className="w-full border-t border-gray-200 dark:border-gray-700 my-4 relative">
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-2 text-gray-500 text-sm">
          OR
        </span>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          disabled={recordingState !== 'idle'}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={recordingState !== 'idle' || !inputText.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>

      {error && (
        <div className="text-red-500 text-center max-w-md px-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
