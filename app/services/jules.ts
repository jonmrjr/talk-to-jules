import { JulesSession, JulesSource } from '../app/types';

export class JulesClient {
  private apiKey: string;
  private baseUrl = 'https://jules.googleapis.com/v1alpha';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-Goog-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.error?.message || errorBody.message || response.statusText || 'Unknown error';
      throw new Error(`Jules API Error: ${errorMessage}`);
    }

    return response.json();
  }

  async listSessions(pageSize = 10): Promise<JulesSession[]> {
    const data = await this.fetch(`/sessions?pageSize=${pageSize}`);
    return data.sessions || [];
  }

  async createSession(prompt: string, source: string, title?: string): Promise<JulesSession> {
    const body = {
      prompt,
      sourceContext: {
        source,
        githubRepoContext: {
          startingBranch: 'main' // Defaulting to main, could be configurable
        }
      },
      title: title || prompt.slice(0, 50),
    };

    return this.fetch('/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async listSources(pageSize = 10): Promise<JulesSource[]> {
    const data = await this.fetch(`/sources?pageSize=${pageSize}`);
    return data.sources || [];
  }

  async approvePlan(sessionName: string): Promise<void> {
    await this.fetch(`/${sessionName}:approvePlan`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async sendMessage(sessionName: string, message: string): Promise<void> {
    await this.fetch(`/${sessionName}:sendMessage`, {
      method: 'POST',
      body: JSON.stringify({ message: { text: message } }),
    });
  }

  async getSession(sessionName: string): Promise<JulesSession> {
    return this.fetch(`/${sessionName}`);
  }

  async listActivities(sessionName: string, pageSize = 10): Promise<any[]> {
    const data = await this.fetch(`/${sessionName}/activities?pageSize=${pageSize}`);
    return data.activities || [];
  }
}
