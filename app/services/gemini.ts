import { JulesClient } from './jules';
import { Interaction, InteractionResponse, ToolCall } from '../types';

export const transcribeAudio = async (audioBlob: Blob, geminiApiKey: string): Promise<string | null> => {
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
};

export const processWithGemini = async (
  prompt: string,
  julesClient: JulesClient,
  geminiApiKey: string,
  defaultRepo: string,
  previousInteractions: Interaction[]
): Promise<InteractionResponse> => {
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
            },
            repo: {
              type: "STRING",
              description: "The repository to create the task in (optional). Must be in the format 'sources/{source}'. If not provided, the default repo will be used."
            }
          },
          required: ["prompt"]
        }
      },
      {
        name: "approve_plan",
        description: "Approves a plan in a session.",
        parameters: {
          type: "OBJECT",
          properties: {
            sessionName: {
              type: "STRING",
              description: "The name of the session to approve the plan for."
            }
          },
          required: ["sessionName"]
        }
      },
      {
        name: "send_message",
        description: "Sends a message from the user to a session.",
        parameters: {
          type: "OBJECT",
          properties: {
            sessionName: {
              type: "STRING",
              description: "The name of the session to send the message to."
            },
            message: {
              type: "STRING",
              description: "The message to send."
            }
          },
          required: ["sessionName", "message"]
        }
      },
      {
        name: "get_session",
        description: "Gets a single session.",
        parameters: {
          type: "OBJECT",
          properties: {
            sessionName: {
              type: "STRING",
              description: "The name of the session to get."
            }
          },
          required: ["sessionName"]
        }
      },
      {
        name: "list_activities",
        description: "Lists activities for a session.",
        parameters: {
          type: "OBJECT",
          properties: {
            sessionName: {
              type: "STRING",
              description: "The name of the session to list activities for."
            }
          },
          required: ["sessionName"]
        }
      }
    ]
  }];

  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const history = previousInteractions
    .filter(interaction => {
      const time = new Date(interaction.timestamp);
      return time >= thirtyMinutesAgo && interaction.response; // Only include completed interactions
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Oldest first
    .flatMap(interaction => [
      { role: "user", parts: [{ text: `[Past Interaction ${interaction.timestamp.toLocaleTimeString()}] ${interaction.text}` }] },
      { role: "model", parts: [{ text: interaction.response || "" }] }
    ]);

  let messages = [
    ...history,
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

  if (!part) return { text: "No response from Gemini." };

  // Check for function call
  if (part.functionCall) {
    const functionCall = part.functionCall;
    const functionName = functionCall.name;
    let functionResponse;
    let toolCallInfo: ToolCall = {
        name: functionName,
        args: functionCall.args,
        result: null
    };

    try {
      if (functionName === "list_running_tasks") {
        const sessions = await julesClient.listSessions();
        functionResponse = { sessions };
      } else if (functionName === "create_task") {
        const taskPrompt = functionCall.args.prompt;
        const repo = functionCall.args.repo || defaultRepo;
        const session = await julesClient.createSession(taskPrompt, repo);
        functionResponse = { session };
      } else if (functionName === "approve_plan") {
        await julesClient.approvePlan(functionCall.args.sessionName);
        functionResponse = { success: true };
      } else if (functionName === "send_message") {
        await julesClient.sendMessage(
          functionCall.args.sessionName,
          functionCall.args.message
        );
        functionResponse = { success: true };
      } else if (functionName === "get_session") {
        const session = await julesClient.getSession(
          functionCall.args.sessionName
        );
        functionResponse = { session };
      } else if (functionName === "list_activities") {
        const activities = await julesClient.listActivities(
          functionCall.args.sessionName
        );
        functionResponse = { activities };
      } else {
        functionResponse = { error: "Unknown function" };
      }
      toolCallInfo.result = functionResponse;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error during tool execution";
      functionResponse = { error: errorMsg };
      toolCallInfo.result = { error: errorMsg };
    }

    // Send function response back to Gemini
    const functionResponsePart = {
      functionResponse: {
        name: functionName,
        response: { result: functionResponse }
      }
    };

    messages.push({ role: "model", parts: [part] });
    messages.push({ role: "function", parts: [functionResponsePart] } as any);

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
    const finalText = data2.candidates?.[0]?.content?.parts?.[0]?.text || "No final response.";

    return {
        text: finalText,
        toolCalls: [toolCallInfo]
    };
  }

  return { text: part.text || "No text response." };
};
