'use client';

import React, { useState, useEffect } from 'react';

interface SettingsProps {
  onClose: () => void;
  onSave: (geminiKey: string, julesKey: string, defaultRepo: string) => void;
  initialGeminiKey?: string;
  initialJulesKey?: string;
  initialDefaultRepo?: string;
  recentSources?: string[];
}

const Settings: React.FC<SettingsProps> = ({
  onClose,
  onSave,
  initialGeminiKey = '',
  initialJulesKey = '',
  initialDefaultRepo = '',
  recentSources = [],
}) => {
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey);
  const [julesKey, setJulesKey] = useState(initialJulesKey);
  const [defaultRepo, setDefaultRepo] = useState(initialDefaultRepo);
  const [showManualRepoInput, setShowManualRepoInput] = useState(false);

  useEffect(() => {
    setShowManualRepoInput(recentSources.length === 0);
  }, [recentSources]);

  const handleSave = () => {
    try {
      localStorage.setItem('geminiApiKey', geminiKey);
      localStorage.setItem('julesApiKey', julesKey);
      localStorage.setItem('defaultRepo', defaultRepo);
      onSave(geminiKey, julesKey, defaultRepo);
      onClose();
    } catch (error) {
      console.error('Failed to save API keys:', error);
      alert('Failed to save settings. Please check if local storage is available.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Settings
        </h2>
        
        <div className="space-y-4">
          <div>
            <label 
              htmlFor="gemini-key" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Gemini API Key
            </label>
            <input
              id="gemini-key"
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label 
              htmlFor="jules-key" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Jules API Key
            </label>
            <input
              id="jules-key"
              type="password"
              value={julesKey}
              onChange={(e) => setJulesKey(e.target.value)}
              placeholder="Enter your Jules API key"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="default-repo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Default Repo (Source)
            </label>
            {showManualRepoInput ? (
              <input
                id="default-repo"
                type="text"
                value={defaultRepo}
                onChange={(e) => setDefaultRepo(e.target.value)}
                placeholder="e.g. sources/github/user/repo"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <select
                id="default-repo"
                value={defaultRepo}
                onChange={(e) => setDefaultRepo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="" disabled>Select a recent repository</option>
                {recentSources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            )}
            {recentSources.length > 0 && (
              <button
                onClick={() => setShowManualRepoInput(!showManualRepoInput)}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showManualRepoInput ? 'Select from list' : 'Enter manually'}
              </button>
            )}
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg
                     transition-colors duration-200"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500
                     text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg
                     transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
