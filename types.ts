export enum BabyState {
  SLEEPING = 'SLEEPING',
  CRYING = 'CRYING',
  LISTENING = 'LISTENING',
  HAPPY = 'HAPPY',
  PAUSED = 'PAUSED'
}

export enum AppMode {
  SETUP = 'SETUP',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

export interface AudioVisualizerData {
  volume: number; // 0 to 1
  isSpeaking: boolean;
}