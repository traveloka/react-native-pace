import { EventEmitter } from 'events';

export type NetworkingEventListener = EventEmitter;

export interface NetworkingOptions {
  blackListContentTypes?: RegExp;
  blackListUrls?: RegExp;
  whiteListUrls?: RegExp;
}

export type PaceProps = {
  tick: number;
  resetDelay: number;
  children?: any;
  config: NetworkingOptions;
};

export type PaceState = {
  progress: number;
  status: 'IDLE' | 'START' | 'DONE';
};

declare module 'react-native/*';
