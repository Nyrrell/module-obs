export enum EObsEvent {
  LOAD = 'obs-load',
  UNLOAD = 'obs-unload',
  OPEN = 'obs-open',
  CLOSE = 'obs-close',
  ERROR = 'obs-error',
  SWITCH_SCENE = 'obs-switch-scene',
  STREAM_STARTING = 'obs-stream-starting',
  STREAM_STARTED = 'obs-stream-started',
  STREAM_STOPPING = 'obs-stream-stopping',
  STREAM_STOPPED = 'obs-stream-stopped',
  STREAM_STATUS = 'obs-stream-status',
  RECORDING_STARTING = 'obs-recording-starting',
  RECORDING_STARTED = 'obs-recording-started',
  RECORDING_STOPPING = 'obs-recording-stopping',
  RECORDING_STOPPED = 'obs-recording-stopped',
  RECORDING_PAUSED = 'obs-recording-paused',
  RECORDING_RESUMED = 'obs-recording-resumed',
  SOURCE_CREATED = 'obs-source-created',
  SOURCE_DESTROYED = 'obs-source-destroyed',
  SOURCE_MUTE_CHANGED = 'obs-source-mute-changed',
  SOURCE_VOLUME_CHANGED = 'obs-source-volume-changed',
  SOURCE_RENAMED = 'obs-source-renamed',
  FILTER_ADDED = 'obs-filter-added',
  FILTER_REMOVED = 'obs-filter-removed',
  FILTER_VISIBILITY_CHANGED = 'obs-filter-visibility-changed',
  SCENEITEM_ADDED = 'obs-sceneitem-added',
  SCENEITEM_REMOVED = 'obs-sceneitem-removed',
  SCENEITEM_VISIBILITY_CHANGED = 'obs-sceneitem-visibility-changed',
  SCENEITEM_TRANSFORM_CHANGED = 'obs-sceneitem-transform-changed',
}