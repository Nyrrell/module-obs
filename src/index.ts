import process from 'process'
import { getEvntComClientFromChildProcess, getEvntComServerFromChildProcess } from "evntboard-communicate";
import OBSWebSocket from 'obs-websocket-js'
import { debounce } from 'throttle-debounce'
import { EObsEvent } from './EObsEvent'

// parse params
const { name: NAME, customName: CUSTOM_NAME, config: { host: HOST, port: PORT, password: PASSWORD } } = JSON.parse(process.argv[2])
const EMITTER = CUSTOM_NAME || NAME

const evntComClient = getEvntComClientFromChildProcess();
const evntComServer = getEvntComServerFromChildProcess();

// real starting

let obs: OBSWebSocket
let connected: boolean
let attemps: number = 0

const onNewEvent = (data: any): void => {
  if (data?.emitter !== EMITTER) return
  switch (data?.event) {
    case EObsEvent.OPEN:
      attemps = 0
      break
    case EObsEvent.CLOSE:
      tryReconnect()
      break
    default:
      break
  }
}

const load = async () => {
  try {
    obs = new OBSWebSocket()

    // don't spam EB !!
    const debounceTransform = debounce(500, (data) => {
      evntComClient?.newEvent(EObsEvent.SCENEITEM_TRANSFORM_CHANGED, data, { emitter: EMITTER })
    })

    // don't spam EB !!
    const debounceVolumeChange = debounce(500, (data) => {
      evntComClient?.newEvent(EObsEvent.SOURCE_VOLUME_CHANGED, data, { emitter: EMITTER })
    })

    obs.on('ConnectionOpened', () => {
      connected = true
      evntComClient?.newEvent(EObsEvent.OPEN, { emitter: EMITTER })
    })

    obs.on('ConnectionClosed', () => {
      connected = false
      evntComClient?.newEvent(EObsEvent.CLOSE, { emitter: EMITTER })
    })

    obs.on('Exiting', () => {
      connected = false
    })

    obs.on('SwitchScenes', (data) => {
      evntComClient?.newEvent(EObsEvent.SWITCH_SCENE, data, { emitter: EMITTER })
    })

    obs.on('StreamStarting', (data) => {
      evntComClient?.newEvent(EObsEvent.STREAM_STARTING, data, { emitter: EMITTER })
    })

    obs.on('StreamStarted', () => {
      evntComClient?.newEvent(EObsEvent.STREAM_STARTED, { emitter: EMITTER })
    })

    obs.on('StreamStopping', (data) => {
      evntComClient?.newEvent(EObsEvent.STREAM_STOPPING, data, { emitter: EMITTER })
    })

    obs.on('StreamStopping', (data) => {
      evntComClient?.newEvent(EObsEvent.STREAM_STOPPED, data, { emitter: EMITTER })
    })

    obs.on('StreamStatus', (data) => {
      evntComClient?.newEvent(EObsEvent.STREAM_STATUS, data, { emitter: EMITTER })
    })

    obs.on('RecordingStarting', () => {
      evntComClient?.newEvent(EObsEvent.RECORDING_STARTING, null, { emitter: EMITTER })
    })

    obs.on('RecordingStarted', () => {
      evntComClient?.newEvent(EObsEvent.RECORDING_STARTED, null, { emitter: EMITTER })
    })

    obs.on('RecordingStopping', () => {
      evntComClient?.newEvent(EObsEvent.RECORDING_STOPPING, null, { emitter: EMITTER })
    })

    obs.on('RecordingStopped', () => {
      evntComClient?.newEvent(EObsEvent.RECORDING_STOPPED, null, { emitter: EMITTER })
    })

    obs.on('RecordingPaused', () => {
      evntComClient?.newEvent(EObsEvent.RECORDING_PAUSED, null, { emitter: EMITTER })
    })

    obs.on('RecordingResumed', () => {
      evntComClient?.newEvent(EObsEvent.RECORDING_RESUMED, null, { emitter: EMITTER })
    })

    obs.on('SourceCreated', (data) => {
      evntComClient?.newEvent(EObsEvent.SOURCE_CREATED, data, { emitter: EMITTER })
    })

    obs.on('SourceDestroyed', (data) => {
      evntComClient?.newEvent(EObsEvent.SOURCE_DESTROYED, data, { emitter: EMITTER })
    })

    obs.on('SourceVolumeChanged', (data) => {
      debounceVolumeChange(data)
    })

    obs.on('SourceMuteStateChanged', (data) => {
      evntComClient?.newEvent(EObsEvent.SOURCE_MUTE_CHANGED, data, { emitter: EMITTER })
    })

    obs.on('SourceRenamed', (data) => {
      evntComClient?.newEvent(EObsEvent.SOURCE_RENAMED, data, { emitter: EMITTER })
    })

    obs.on('SourceFilterAdded', (data) => {
      evntComClient?.newEvent(EObsEvent.FILTER_ADDED, data, { emitter: EMITTER })
    })

    obs.on('SourceFilterRemoved', (data) => {
      evntComClient?.newEvent(EObsEvent.FILTER_REMOVED, data, { emitter: EMITTER })
    })

    obs.on('SourceFilterVisibilityChanged', (data) => {
      evntComClient?.newEvent(EObsEvent.FILTER_VISIBILITY_CHANGED, data, { emitter: EMITTER })
    })

    obs.on('SceneItemAdded', (data) => {
      evntComClient?.newEvent(EObsEvent.SCENEITEM_ADDED, data, { emitter: EMITTER })
    })

    obs.on('SceneItemRemoved', (data) => {
      evntComClient?.newEvent(EObsEvent.SCENEITEM_REMOVED, data, { emitter: EMITTER })
    })

    obs.on('SceneItemVisibilityChanged', (data) => {
      evntComClient?.newEvent(EObsEvent.SCENEITEM_VISIBILITY_CHANGED, data, { emitter: EMITTER })
    })

    obs.on('SceneItemTransformChanged', (data) => {
      debounceTransform(data)
    })

    evntComClient?.newEvent(EObsEvent.LOAD, null, { emitter: EMITTER })

    await obs.connect({ address: `${HOST}:${PORT}`, password: PASSWORD })
  } catch (e) {
    console.error(e)
    obs = null
    evntComClient?.newEvent(EObsEvent.ERROR, null, { emitter: EMITTER })
  }
}

const unload = async () => {
  connected = false
  obs.disconnect()
  evntComClient?.newEvent(EObsEvent.UNLOAD, null, { emitter: EMITTER })
}

const reload = async () => {
  await unload()
  await load()
}

const tryReconnect = () => {
  attemps += 1
  console.log(`Attempt to reconnect OBS for the ${attemps} time(s)`)
  const waintingTime = attemps * 5000
  setTimeout(async () => await load(), waintingTime)
}

evntComServer.expose('newEvent', onNewEvent)
evntComServer.expose('load', load)
evntComServer.expose('unload', unload)
evntComServer.expose('reload', reload)

// Général
const getVersion = async (): Promise<any> => await obs?.send('GetVersion')
const getStats = async (): Promise<any> => await obs?.send('GetStats')
const getInfo = async (): Promise<any> => await obs?.send('GetVideoInfo')

evntComServer.expose('getVersion', getVersion)
evntComServer.expose('getStats', getStats)
evntComServer.expose('getInfo', getInfo)

// Scenes
const sceneGetCurrent = async (): Promise<any> => await obs?.send('GetCurrentScene')
const sceneSetCurrent = async (scene: string): Promise<any> => await obs?.send('SetCurrentScene', { 'scene-name': scene })

evntComServer.expose('sceneGetCurrent', sceneGetCurrent)
evntComServer.expose('sceneSetCurrent', sceneSetCurrent)

// Sources
const sourceGetSettings = async (sourceName: string, sourceType?: string): Promise<any> => await obs?.send('GetSourceSettings', { sourceName, sourceType })
const sourceSetSettings = async (sourceName: string, sourceSettings: {}, sourceType?: string): Promise<any> => await obs?.send('SetSourceSettings', { sourceName, sourceSettings, sourceType })
const sourceGetVolume = async (source: string, useDecibel?: boolean): Promise<any> => await obs?.send('GetVolume', { source, useDecibel })
const sourceSetVolume = async (source: string, volume: number, useDecibel?: boolean): Promise<any> => await obs?.send('SetVolume', { source, useDecibel, volume })
const sourceGetMute = async (source: string): Promise<any> => await obs?.send('GetMute', { source })
const sourceSetMute = async (source: string, mute: boolean): Promise<any> => await obs?.send('SetMute', { source, mute })
const sourceMuteToggle = async (source: string): Promise<any> => await obs?.send('ToggleMute', { source })

evntComServer.expose('sourceGetSettings', sourceGetSettings)
evntComServer.expose('sourceSetSettings', sourceSetSettings)
evntComServer.expose('sourceGetVolume', sourceGetVolume)
evntComServer.expose('sourceSetVolume', sourceSetVolume)
evntComServer.expose('sourceGetMute', sourceGetMute)
evntComServer.expose('sourceSetMute', sourceSetMute)
evntComServer.expose('sourceMuteToggle', sourceMuteToggle)

// text

const textGDIGetSettings = async (source: string): Promise<any> => await obs?.send('GetTextGDIPlusProperties', { source })
const textGDISetSettings = async (source: string, settings: {}): Promise<any> => await obs?.send('SetTextGDIPlusProperties', { source, ...settings })
const textFreeGetSettings = async (source: string): Promise<any> => await obs?.send('GetTextFreetype2Properties', { source })
const textFreeSetSettings = async (source: string, settings: {}): Promise<any> => await obs?.send('SetTextFreetype2Properties', { source, ...settings })

evntComServer.expose('textGDIGetSettings', textGDIGetSettings)
evntComServer.expose('textGDISetSettings', textGDISetSettings)
evntComServer.expose('textFreeGetSettings', textFreeGetSettings)
evntComServer.expose('textFreeSetSettings', textFreeSetSettings)

// filter
const filterGetSettings = async (source: string, filter: string): Promise<any> => await obs?.send('GetSourceFilterInfo', { sourceName: source, filterName: filter })
const filterSetSettings = async (source: string, filter: string, settings: {}): Promise<any> => await obs?.send('SetSourceFilterSettings', { sourceName: source, filterName: filter, filterSettings: settings })
const filterSetVisibility = async (source: string, filter: string, enable: boolean): Promise<any> => await obs?.send('SetSourceFilterVisibility', { sourceName: source, filterName: filter, filterEnabled: enable })
const filterToggleVisibility = async (source: string, filter: string): Promise<any> => {
  const { enabled } = await filterGetSettings(source, filter)
  return await filterSetVisibility(source, filter, !enabled)
}

evntComServer.expose('filterGetSettings', filterGetSettings)
evntComServer.expose('filterSetSettings', filterSetSettings)
evntComServer.expose('filterSetVisibility', filterSetVisibility)
evntComServer.expose('filterToggleVisibility', filterToggleVisibility)

// Scene Items

const sourceItemGetSettings = async (scene: string, itemName: string): Promise<any> => await obs.send('GetSceneItemProperties', { 'scene-name': scene, item: { name: itemName } })
const sceneItemSetSettings = async (scene: string, itemName: string, settings: {}): Promise<any> => await obs.send('SetSceneItemProperties', {
  'scene-name': scene,
  item: { name: itemName },
  position: {},
  bounds: {},
  scale: {},
  crop: {},
  ...settings
})

const sourceItemSetVisibility = async (scene: string, itemName: string, visibility: boolean): Promise<any> => {
  return await obs.send('SetSceneItemProperties', {
    'scene-name': scene,
    item: { name: itemName },
    position: {},
    bounds: {},
    scale: {},
    crop: {},
    visible: visibility
  })
}

const sourceItemVisibilityToggle = async (scene: string, itemName: string): Promise<any> => {
  const { visible } = await sourceItemGetSettings(scene, itemName)
  return await obs.send('SetSceneItemProperties', {
    'scene-name': scene,
    item: { name: itemName },
    visible: !visible,
    position: {},
    bounds: {},
    scale: {},
    crop: {}
  })
}

const sourceItemSetScale = async (scene: string, itemName: string, x: number, y: number): Promise<any> => {
  return await obs.send('SetSceneItemProperties', {
    'scene-name': scene,
    item: { name: itemName },
    scale: { x, y },
    position: {},
    bounds: {},
    crop: {}
  })
}

const sourceItemSetPosition = async (scene: string, itemName: string, x: number, y: number): Promise<any> => {
  return await obs.send('SetSceneItemProperties', {
    'scene-name': scene,
    item: { name: itemName },
    position: { x, y },
    bounds: {},
    scale: {},
    crop: {}
  })
}

const sourceItemSetRotation = async (scene: string, itemName: string, rotation: number): Promise<any> => {
  return await obs.send('SetSceneItemProperties', {
    'scene-name': scene,
    item: { name: itemName },
    rotation,
    position: {},
    bounds: {},
    scale: {},
    crop: {}
  })
}

evntComServer.expose('sourceItemGetSettings', sourceItemGetSettings)
evntComServer.expose('sceneItemSetSettings', sceneItemSetSettings)
evntComServer.expose('sourceItemSetVisibility', sourceItemSetVisibility)
evntComServer.expose('sourceItemVisibilityToggle', sourceItemVisibilityToggle)
evntComServer.expose('sourceItemSetScale', sourceItemSetScale)
evntComServer.expose('sourceItemSetPosition', sourceItemSetPosition)
evntComServer.expose('sourceItemSetRotation', sourceItemSetRotation)

// Streaming

const streamingGetStatus = async (): Promise<any> => await obs.send('GetStreamingStatus')
const streamingToggle = async (): Promise<any> => await obs.send('StartStopStreaming')
const streamingStart = async (): Promise<any> => await obs.send('StartStreaming', {})
const streamingStop = async (): Promise<any> => await obs.send('StopStreaming')

evntComServer.expose('streamingGetStatus', streamingGetStatus)
evntComServer.expose('streamingToggle', streamingToggle)
evntComServer.expose('streamingStart', streamingStart)
evntComServer.expose('streamingStop', streamingStop)

// Recording

const recordingGetStatus = async (): Promise<any> => await obs.send('GetStreamingStatus')
const recordingToggle = async (): Promise<any> => await obs.send('StartStopRecording')
const recordingStart = async (): Promise<any> => await obs.send('StartRecording')
const recordingStop = async (): Promise<any> => await obs.send('StopRecording')
const recordingPause = async (): Promise<any> => await obs.send('PauseRecording')
const recordingResume = async (): Promise<any> => await obs.send('ResumeRecording')

evntComServer.expose('recordingGetStatus', recordingGetStatus)
evntComServer.expose('recordingToggle', recordingToggle)
evntComServer.expose('recordingStart', recordingStart)
evntComServer.expose('recordingStop', recordingStop)
evntComServer.expose('recordingPause', recordingPause)
evntComServer.expose('recordingResume', recordingResume)
