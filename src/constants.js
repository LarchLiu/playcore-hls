export const HLS_SDK = 'https://cdn.jsdelivr.net/npm/hls.js@latest'

export const LOAD_SDK_TIMEOUT = 60 * 1000

export const DEFAULT_HLS_RESOLUTION = '1080p'

export const HLS_DEFAULT_CONFIG = {
  maxBufferLength: 10,
  startPosition: -1,
  nudgeMaxRetry: 8,
  enableSoftwareAES: false,
  autoStartLoad: false,
  nextAutoLevel: -1,
  capLevelToPlayerSize: false,
  maxSeekHole: 0,
  abrBandWidthUpFactor: 1
}

// some hls error is not hight level for UI to response
export const HLS_ERROR_WHITE = {
    networkError: { count: 0 },
    mediaError: { count: 0 },
}

export const HLS_EVENTS = {
  MANIFEST_PARSED: 'hlsManifestParsed',
  LEVEL_SWITCHED: 'hlsLevelSwitched',
  FRAG_LOADED: 'hlsFragLoaded',
  FRAG_BUFFERED: 'hlsFragBuffered',
  ERROR: 'hlsError',
  LEVEL_LOADED: 'hlsLevelLoaded',
  BUFFER_APPENDED: 'hlsBufferAppended',
};
