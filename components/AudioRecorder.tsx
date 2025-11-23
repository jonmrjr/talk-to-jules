'use client';

import React, { useState, useRef, useEffect } from 'react';
import { JulesClient } from '../lib/jules';

interface AudioRecorderProps {
  onTranscription: (text: string, response?: string) => void;
  geminiApiKey: string;
  julesApiKey: string;
  defaultRepo: string;
}

type RecordingState = 'idle' | 'recording' | 'transcribing';

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscription,
  geminiApiKey,
  julesApiKey,
  defaultRepo
}) => {
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
        await processAudio(audioBlob);
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

  const processAudio = async (audioBlob: Blob) => {
    if (!geminiApiKey) {
      setError('Please configure your Gemini API key in settings');
      setRecordingState('idle');
      return;
    }

    try {
      // 1. Transcribe Audio
      const transcription = await transcribeAudio(audioBlob);
      if (!transcription) return;

      // 2. Call Gemini with Jules Tools if configured
      if (julesApiKey && defaultRepo) {
        const julesClient = new JulesClient(julesApiKey);
        const response = await processWithGemini(transcription, julesClient);
        onTranscription(transcription, response);
      } else {
        onTranscription(transcription);
      }

      setRecordingState('idle');
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(`Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setRecordingState('idle');
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            const base64Data = base64Audio.split(',')[1];

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { text: "Please transcribe this audio accurately. Only return the transcription, nothing else." },
                      { inline_data: { mime_type: audioBlob.type, data: base64Data } }
                    ]
                  }]
                })
              }
            );

            const data = await response.json();
            if (data.error) throw new Error(data.error.message || 'Transcription failed');

            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
              resolve(data.candidates[0].content.parts[0].text);
            } else {
              reject(new Error('No transcription received'));
            }
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read audio file'));
      });
    } catch (err) {
      throw err;
    }
  };

  const processWithGemini = async (prompt: string, julesClient: JulesClient): Promise<string> => {
    const tools = [{
      function_declarations: [
        {
          name: "list_running_tasks",
          description: "Lists the currently running coding tasks or sessions.",
        },
        {
          name: "create_task",
          description: "Creates a new coding task or session with the given prompt.",
          parameters: {
            type: "OBJECT",
            properties: {
              prompt: {
                type: "STRING",
                description: "The description of the coding task to be performed."
              }
            },
            required: ["prompt"]
          }
        }
      ]
    }];

    let messages = [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ];

    // Initial call to Gemini
    const response1 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          tools: tools
        })
      }
    );

    const data1 = await response1.json();

    if (data1.error) throw new Error(data1.error.message);

    const candidate = data1.candidates?.[0];
    const content = candidate?.content;
    const part = content?.parts?.[0];

    if (!part) return "No response from Gemini.";

    // Check for function call
    if (part.functionCall) {
      const functionCall = part.functionCall;
      const functionName = functionCall.name;
      let functionResponse;

      try {
        if (functionName === "list_running_tasks") {
          const sessions = await julesClient.listSessions();
          functionResponse = { sessions };
        } else if (functionName === "create_task") {
          const taskPrompt = functionCall.args.prompt;
          const session = await julesClient.createSession(taskPrompt, defaultRepo);
          functionResponse = { session };
        } else {
          functionResponse = { error: "Unknown function" };
        }
      } catch (e) {
        functionResponse = { error: e instanceof Error ? e.message : "Unknown error during tool execution" };
      }

      // Send function response back to Gemini
      const functionResponsePart = {
        functionResponse: {
          name: functionName,
          response: { result: functionResponse }
        }
      };

      messages.push({ role: "model", parts: [part] });
      messages.push({ role: "function", parts: [functionResponsePart] } as any); // Casting as any because function role structure is specific

      const response2 = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages,
            tools: tools
          })
        }
      );

      const data2 = await response2.json();
      return data2.candidates?.[0]?.content?.parts?.[0]?.text || "No final response.";
    }

    return part.text || "No text response.";
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
