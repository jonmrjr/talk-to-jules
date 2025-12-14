'use client';

import { useState } from 'react';

interface SettingsProps {
  onClose: () => void;
  onSave: (geminiApiKey: string, julesApiKey: string, defaultRepo: string) => void;
  initialGeminiKey: string;
  initialJulesKey: string;
  initialDefaultRepo: string;
  recentSources?: string[];
}

export default function Settings({
  onClose,
  onSave,
  initialGeminiKey,
  initialJulesKey,
  initialDefaultRepo,
  recentSources = []
}: SettingsProps) {
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey);
  const [julesKey, setJulesKey] = useState(initialJulesKey);
  const [defaultRepo, setDefaultRepo] = useState(initialDefaultRepo);

  const handleSave = () => {
    localStorage.setItem('geminiApiKey', geminiKey);
    localStorage.setItem('julesApiKey', julesKey);
    localStorage.setItem('defaultRepo', defaultRepo);
    onSave(geminiKey, julesKey, defaultRepo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 transform transition-all scale-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 tracking-tight">Settings</h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gemini API Key</label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter your Gemini API key"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jules API Key</label>
            <input
              type="password"
              value={julesKey}
              onChange={(e) => setJulesKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter your Jules API key"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Repo (Source)</label>
            <input
              type="text"
              value={defaultRepo}
              onChange={(e) => setDefaultRepo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="e.g. sources/github/user/repo"
              list="recent-sources"
            />
             {recentSources.length > 0 && (
              <datalist id="recent-sources">
                {recentSources.map((source, index) => (
                  <option key={index} value={source} />
                ))}
              </datalist>
            )}
            <p className="mt-1 text-xs text-gray-500">
                This repository will be used as the context for your tasks.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
