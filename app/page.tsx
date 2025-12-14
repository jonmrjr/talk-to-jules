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
    <main className="min-h-screen bg-gray-50 text-gray-900 selection:bg-yellow-200 selection:text-black">
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-lg">J</div>
             <h1 className="text-xl font-bold tracking-tight">Talk to Jules</h1>
          </div>

          <div className="flex items-center gap-4">
            {defaultRepo && <span className="hidden md:block text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200 truncate max-w-[200px]">{defaultRepo}</span>}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all duration-200"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-gray-900">Voice to Prompt</h2>
            <p className="text-lg text-gray-500 font-light">Record your voice to interact with your codebases.</p>
        </div>

        <div className="mb-16">
          <AudioRecorder
            onTranscriptionStart={handleTranscriptionStart}
            onInteractionUpdate={handleInteractionUpdate}
            geminiApiKey={geminiApiKey}
            julesApiKey={julesApiKey}
            defaultRepo={defaultRepo}
            previousInteractions={interactions}
          />
        </div>

        {interactions.length > 0 ? (
          <div className="space-y-8">
            {interactions.map(item => (
              <div key={item.id} className="group relative pl-8 border-l border-gray-200">
                <div className="absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full bg-gray-200 group-hover:bg-black transition-colors duration-300"></div>

                <div className="mb-2 flex justify-between items-baseline">
                   <span className="text-sm font-semibold text-gray-900">You</span>
                   <span className="text-xs text-gray-400 font-mono">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-lg text-gray-800 mb-6 leading-relaxed">{item.text}</p>

                {item.toolCalls && item.toolCalls.length > 0 && (
                  <div className="mb-6 space-y-3">
                    {item.toolCalls.map((toolCall, idx) => {
                      const toolCallId = `${item.id}-${idx}`;
                      const isExpanded = expandedToolCalls.has(toolCallId);
                      return (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <button
                            onClick={() => toggleToolCall(toolCallId)}
                            className="w-full text-left px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                               <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Tool</span>
                               <span className="font-mono text-sm text-black">{toolCall.name}</span>
                            </div>
                            <span className="text-gray-400 text-xs font-mono">{isExpanded ? 'Hide' : 'Show'}</span>
                          </button>

                          {isExpanded && (
                            <div className="px-4 py-3 bg-white border-t border-gray-100">
                              <div className="mb-2">
                                <span className="text-xs uppercase tracking-wider font-bold text-gray-400 block mb-1">Arguments</span>
                                <pre className="text-xs font-mono bg-gray-50 p-2 rounded text-gray-700 overflow-x-auto">
                                  {JSON.stringify(toolCall.args, null, 2)}
                                </pre>
                              </div>
                              {toolCall.result && (
                                <div>
                                  <span className="text-xs uppercase tracking-wider font-bold text-green-600 block mb-1">Result</span>
                                  <pre className="text-xs font-mono bg-green-50 p-2 rounded text-green-800 overflow-x-auto">
                                    {JSON.stringify(toolCall.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {item.isLoading && !item.response ? (
                  <div className="flex items-center gap-2 text-gray-400 animate-pulse mt-4">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm font-medium">Processing</span>
                  </div>
                ) : item.response && (
                  <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
                     <div className="mb-3 text-sm font-semibold text-blue-600 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]">J</div>
                        Jules
                     </div>
                     <div data-testid="jules-response" className="prose prose-slate prose-sm max-w-none">
                        <ReactMarkdown>{item.response}</ReactMarkdown>
                     </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="text-4xl mb-4 text-gray-300">🎙️</div>
            <p className="text-gray-400 font-medium">No interactions yet.</p>
            <p className="text-gray-400 text-sm">Start by recording a message above.</p>
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
    </main>
  );
}
