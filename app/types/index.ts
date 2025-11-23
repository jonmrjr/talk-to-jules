export interface ToolCall {
  name: string;
  args: any;
  result: any;
}

export interface InteractionResponse {
  text: string;
  toolCalls?: ToolCall[];
}

export interface Interaction {
  id: string;
  text: string;
  response?: string;
  toolCalls?: ToolCall[];
  isLoading?: boolean;
  timestamp: Date;
}

export interface JulesSession {
  name: string;
  createTime: string;
  title: string;
  state: string;
  sourceContext?: {
    source: string;
  };
}

export interface JulesSource {
  name: string;
  displayName: string;
}
