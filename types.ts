export interface WordToken {
  id: string;
  text: string;
  cleanText: string;
  startIndex: number;
  endIndex: number;
}

export interface VoiceOption {
  name: string;
  lang: string;
  uri?: string;
  isLocalService?: boolean; // True for WebSpeech, False for Gemini
}

export interface GeminiStoryConfig {
  topic: string;
  difficulty: 'beginner' | 'intermediate';
}

export type PlaybackMode = 'interactive' | 'hq_stream';

export interface DebugInfo {
  charIndex: number;
  matchedTokenText: string;
  isSpeaking: boolean;
  totalTokens: number;
  lastEventTime: string;
  playbackState: string;
  voiceName?: string;
  isLocalVoice?: boolean;
}