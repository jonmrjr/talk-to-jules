'use client';

import { useState, useEffect } from 'react';
import AudioRecorder from '@/components/AudioRecorder';
import Settings from '@/components/Settings';

interface Transcription {
  text: string;
  timestamp: Date;
}

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [julesApiKey, setJulesApiKey] = useState('');
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);

  useEffect(() => {
    // Load API keys from localStorage on mount
    try {
      const savedGeminiKey = localStorage.getItem('geminiApiKey') || '';
      const savedJulesKey = localStorage.getItem('julesApiKey') || '';
      setGeminiApiKey(savedGeminiKey);
      setJulesApiKey(savedJulesKey);

      // Show settings if no API keys are configured
      if (!savedGeminiKey) {
        setShowSettings(true);
      }
    } catch (error) {
      console.error('Failed to load API keys from localStorage:', error);
    }
  }, []);

  const handleTranscription = (text: string) => {
    setTranscriptions(prev => [{ text, timestamp: new Date() }, ...prev]);
  };

  const handleSaveSettings = (geminiKey: string, julesKey: string) => {
    setGeminiApiKey(geminiKey);
    setJulesApiKey(julesKey);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Talk to Jules
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                     transition-colors duration-200"
            aria-label="Settings"
          >
            <svg 
              className="w-6 h-6 text-gray-600 dark:text-gray-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Voice to Prompt
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Record your voice and get instant transcriptions
          </p>
        </div>

        {/* Audio Recorder */}
        <div className="flex justify-center mb-12">
          <AudioRecorder 
            onTranscription={handleTranscription}
            geminiApiKey={geminiApiKey}
          />
        </div>

        {/* Transcriptions List */}
        {transcriptions.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Transcriptions
            </h3>
            <div className="space-y-3">
              {transcriptions.map((item, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4
                           border-l-4 border-blue-500"
                >
                  <p className="text-gray-800 dark:text-gray-200">{item.text}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {item.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {transcriptions.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="text-6xl mb-4">🎙️</div>
            <p className="text-gray-600 dark:text-gray-400">
              No transcriptions yet. Click the button above to start recording!
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          initialGeminiKey={geminiApiKey}
          initialJulesKey={julesApiKey}
        />
      )}
    </main>
  );
}
