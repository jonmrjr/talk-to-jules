'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import AudioRecorder from '@/components/AudioRecorder';
import Settings from '@/components/Settings';
import { ToolCall, Interaction } from './types';
import { JulesClient } from './services/jules';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [julesApiKey, setJulesApiKey] = useState('');
  const [defaultRepo, setDefaultRepo] = useState('');
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [recentSources, setRecentSources] = useState<string[]>([]);
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const savedGeminiKey = localStorage.getItem('geminiApiKey') || '';
      const savedJulesKey = localStorage.getItem('julesApiKey') || '';
      const savedDefaultRepo = localStorage.getItem('defaultRepo') || '';
      setGeminiApiKey(savedGeminiKey);
      setJulesApiKey(savedJulesKey);
      setDefaultRepo(savedDefaultRepo);
      if (!savedGeminiKey) {
        setShowSettings(true);
      }
    } catch (error) {
      console.error('Failed to load API keys from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (julesApiKey) {
      const julesClient = new JulesClient(julesApiKey);
      julesClient.listSessions()
        .then(sessions => {
          const sources = sessions.map(s => s.sourceContext?.source).filter((s): s is string => !!s);
          const uniqueSources = Array.from(new Set(sources));
          setRecentSources(uniqueSources);
        })
        .catch(err => console.error("Failed to fetch recent sources:", err));
    }
  }, [julesApiKey]);

  const handleTranscriptionStart = (text: string) => {
    const id = uuidv4();
    setInteractions(prev => [{ id, text, isLoading: true, timestamp: new Date() }, ...prev]);
    return id;
  };

  const handleInteractionUpdate = (id: string, update: Partial<{ response: string; toolCalls: ToolCall[] }>) => {
    setInteractions(prev => prev.map(item => item.id === id ? { ...item, ...update, isLoading: false } : item));
  };

  const handleSaveSettings = (geminiKey: string, julesKey: string, repo: string) => {
    setGeminiApiKey(geminiKey);
    setJulesApiKey(julesKey);
    setDefaultRepo(repo);
  };

  const toggleToolCall = (id: string) => {
    setExpandedToolCalls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Talk to Jules</h1>
            {defaultRepo && <p className="text-sm text-gray-500 dark:text-gray-400">Repo: {defaultRepo}</p>}
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Settings"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Voice to Prompt</h2>
          <p className="text-gray-600 dark:text-gray-400">Record your voice and get instant transcriptions</p>
        </div>

        <div className="flex justify-center mb-12">
          <AudioRecorder
            onTranscriptionStart={handleTranscriptionStart}
            onInteractionUpdate={handleInteractionUpdate}
            geminiApiKey={geminiApiKey}
            julesApiKey={julesApiKey}
            defaultRepo={defaultRepo}
            previousInteractions={interactions}
          />
        </div>

        {interactions.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Interactions</h3>
            <div className="space-y-3">
              {interactions.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">You:</div>
                  <p className="text-gray-800 dark:text-gray-200 mb-4">{item.text}</p>
                  {item.toolCalls && item.toolCalls.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {item.toolCalls.map((toolCall, idx) => {
                        const toolCallId = `${item.id}-${idx}`;
                        const isExpanded = expandedToolCalls.has(toolCallId);
                        return (
                          <div key={idx} className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-sm font-mono">
                            <button onClick={() => toggleToolCall(toolCallId)} className="w-full text-left">
                              <div className="flex items-center text-yellow-600 dark:text-yellow-400 font-semibold">
                                <span className="mr-2">🛠️</span>
                                {toolCall.name}
                                <span className="ml-auto">{isExpanded ? '[-]' : '[+]'}</span>
                              </div>
                            </button>
                            {isExpanded && (
                              <>
                                <div className="text-gray-600 dark:text-gray-300 mt-1 text-xs overflow-x-auto">
                                  <span className="font-semibold">Args:</span> {JSON.stringify(toolCall.args)}
                                </div>
                                {toolCall.result && (
                                  <div className="text-green-600 dark:text-green-400 mt-1 text-xs overflow-x-auto">
                                    <span className="font-semibold">Result:</span> {JSON.stringify(toolCall.result)}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {item.isLoading && !item.response ? (
                    <div className="flex items-center text-gray-500 dark:text-gray-400 animate-pulse">
                      <span className="mr-2">Thinking...</span>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce mr-1"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce mr-1 delay-75"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  ) : item.response && (
                    <>
                      <div className="font-medium text-blue-600 dark:text-blue-400 mb-2">Jules:</div>
                      <div data-testid="jules-response" className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <ReactMarkdown className="prose dark:prose-invert max-w-none">{item.response}</ReactMarkdown>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">{item.timestamp.toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {interactions.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="text-6xl mb-4">🎙️</div>
            <p className="text-gray-600 dark:text-gray-400">No transcriptions yet. Click the button above to start recording!</p>
          </div>
        )}
      </div>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          initialGeminiKey={geminiApiKey}
          initialJulesKey={julesApiKey}
          initialDefaultRepo={defaultRepo}
          recentSources={recentSources}
        />
      )}
      <footer className="bg-white dark:bg-gray-800 shadow-inner py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Version: {process.env.NEXT_PUBLIC_COMMIT_HASH}</p>
        </div>
      </footer>
    </main>
  );
}
