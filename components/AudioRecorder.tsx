'use client';

import { useState, useRef, useEffect } from 'react';
import { useAudioRecorder } from '@/app/hooks/useAudioRecorder';
import { ToolCall, Interaction } from '@/app/types';

interface AudioRecorderProps {
  onTranscriptionStart: (text: string) => string;
  onInteractionUpdate: (id: string, update: Partial<{ response: string; toolCalls: ToolCall[] }>) => void;
  geminiApiKey: string;
  julesApiKey: string;
  defaultRepo: string;
  previousInteractions: Interaction[];
}

export default function AudioRecorder({
  onTranscriptionStart,
  onInteractionUpdate,
  geminiApiKey,
  julesApiKey,
  defaultRepo,
  previousInteractions
}: AudioRecorderProps) {
  const {
    isRecording,
    recordingState,
    startRecording,
    stopRecording,
    processText
  } = useAudioRecorder({
    onTranscriptionStart,
    onInteractionUpdate,
    geminiApiKey,
    julesApiKey,
    defaultRepo,
    previousInteractions
  });

  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  const handleSendText = () => {
    if (inputText.trim()) {
      processText(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const isProcessing = recordingState === 'processing' || recordingState === 'transcribing';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="p-4">
            <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Jules anything..."
                rows={1}
                className="w-full resize-none border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:ring-0 text-lg leading-relaxed max-h-64"
                disabled={isProcessing || isRecording}
            />
        </div>

        <div className="px-4 pb-4 pt-2 flex justify-between items-center">
             <div className="flex items-center gap-2">
                {isRecording ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-semibold uppercase tracking-wide animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        Recording
                    </div>
                ) : isProcessing ? (
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold uppercase tracking-wide">
                        <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 font-medium ml-1">Ready</span>
                )}
             </div>

             <div className="flex items-center gap-2">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing || !!inputText.trim()}
                    className={`
                        relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
                        ${isRecording
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200'
                            : inputText.trim()
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800 hover:scale-105 shadow-md shadow-gray-200'
                        }
                    `}
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                    {isRecording ? (
                        <div className="w-3 h-3 bg-white rounded-sm"></div>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>

                {inputText.trim() && (
                    <button
                        onClick={handleSendText}
                        disabled={isProcessing}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 hover:scale-105 transition-all duration-200"
                        title="Send Message"
                    >
                         <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                )}
             </div>
        </div>
      </div>
      <div className="mt-3 text-center text-xs text-gray-400">
         {isRecording ? "Tap to stop" : "Tap microphone to record"}
      </div>
    </div>
  );
}
