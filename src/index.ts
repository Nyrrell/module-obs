require("dotenv").config();
import { EvntComNode } from "evntcom-js/dist/node";
import OBSWebSocket from "obs-websocket-js";
import { debounce } from "throttle-debounce";
import { EObsEvent } from "./EObsEvent";

const NAME: string = process.env.EVNTBOARD_NAME || "obs";
const HOST: string = process.env.EVNTBOARD_HOST || "localhost";
const PORT: number = process.env.EVNTBOARD_PORT
  ? parseInt(process.env.EVNTBOARD_PORT)
  : 5001;
const OBS_HOST: string = process.env.EVNTBOARD_CONFIG_HOST;
const OBS_PORT: string = process.env.EVNTBOARD_CONFIG_PORT;
const OBS_PASSWORD: string = process.env.EVNTBOARD_CONFIG_PASSWORD;

const evntCom = new EvntComNode({
  name: NAME,
  port: PORT,
  host: HOST,
});

// real starting

let obs: OBSWebSocket;
let connected: boolean;
let attemps: number = 0;

evntCom.onEvent = (data: any): void => {
  if (data?.emitter !== NAME) return;
  switch (data?.event) {
    case EObsEvent.OPEN:
      attemps = 0;
      break;
    case EObsEvent.CLOSE:
      tryReconnect();
      break;
    default:
      break;
  }
};

const tryReconnect = () => {
  obs = null;
  attemps += 1;
  console.log(`Attempt to reconnect OBS for the ${attemps} time(s)`);
  const waintingTime = attemps * 5000;
  setTimeout(async () => await load(), waintingTime);
};

const load = async () => {
  await evntCom.callMethod("newEvent", [
    EObsEvent.LOAD,
    null,
    { emitter: NAME },
  ]);
  try {
    obs = new OBSWebSocket();

    // don't spam EB !!
    const debounceTransform = debounce(500, (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SCENEITEM_TRANSFORM_CHANGED,
        data,
        { emitter: NAME },
      ]);
    });

    // don't spam EB !!
    const debounceVolumeChange = debounce(500, (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SOURCE_VOLUME_CHANGED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("ConnectionOpened", () => {
      connected = true;
      evntCom.callMethod("newEvent", [EObsEvent.OPEN, null, { emitter: NAME }]);
    });

    obs.on("ConnectionClosed", () => {
      connected = false;
      evntCom.callMethod("newEvent", [EObsEvent.CLOSE, null, { emitter: NAME }]);
    });

    obs.on("Exiting", () => {
      connected = false;
    });

    obs.on("SwitchScenes", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SWITCH_SCENE,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("StreamStarting", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.STREAM_STARTING,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("StreamStarted", () => {
      evntCom.callMethod("newEvent", [
        EObsEvent.STREAM_STARTED,
        { emitter: NAME },
      ]);
    });

    obs.on("StreamStopping", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.STREAM_STOPPING,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("StreamStopping", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.STREAM_STOPPED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("StreamStatus", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.STREAM_STATUS,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("RecordingStarting", () => {
      evntCom.callMethod("newEvent", [
        EObsEvent.RECORDING_STARTING,
        null,
        { emitter: NAME },
      ]);
    });

    obs.on("RecordingStarted", () => {
      evntCom.callMethod("newEvent", [
        EObsEvent.RECORDING_STARTED,
        null,
        { emitter: NAME },
      ]);
    });

    obs.on("RecordingStopping", () => {
      evntCom.callMethod("newEvent", [
        EObsEvent.RECORDING_STOPPING,
        null,
        { emitter: NAME },
      ]);
    });

    obs.on("RecordingStopped", () => {
      evntCom.callMethod("newEvent", [
        EObsEvent.RECORDING_STOPPED,
        null,
        { emitter: NAME },
      ]);
    });

    obs.on("RecordingPaused", () => {
      evntCom.callMethod("newEvent", [
        EObsEvent.RECORDING_PAUSED,
        null,
        { emitter: NAME },
      ]);
    });

    obs.on("RecordingResumed", () => {
      evntCom.callMethod("newEvent", [
        EObsEvent.RECORDING_RESUMED,
        null,
        { emitter: NAME },
      ]);
    });

    obs.on("SourceCreated", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SOURCE_CREATED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SourceDestroyed", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SOURCE_DESTROYED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SourceVolumeChanged", (data) => {
      debounceVolumeChange(data);
    });

    obs.on("SourceMuteStateChanged", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SOURCE_MUTE_CHANGED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SourceRenamed", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SOURCE_RENAMED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SourceFilterAdded", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.FILTER_ADDED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SourceFilterRemoved", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.FILTER_REMOVED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SourceFilterVisibilityChanged", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.FILTER_VISIBILITY_CHANGED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SceneItemAdded", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SCENEITEM_ADDED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SceneItemRemoved", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SCENEITEM_REMOVED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SceneItemVisibilityChanged", (data) => {
      evntCom.callMethod("newEvent", [
        EObsEvent.SCENEITEM_VISIBILITY_CHANGED,
        data,
        { emitter: NAME },
      ]);
    });

    obs.on("SceneItemTransformChanged", (data) => {
      debounceTransform(data);
    });

    await obs.connect({
      address: `${OBS_HOST}:${OBS_PORT}`,
      password: OBS_PASSWORD,
    });
  } catch (e) {
    console.error(e);
    obs = null;
    await evntCom.callMethod("newEvent", [
      EObsEvent.ERROR,
      null,
      { emitter: NAME },
    ]);
  }
};

evntCom.onOpen = load;

// Général
const getVersion = async (): Promise<any> => await obs?.send("GetVersion");
const getStats = async (): Promise<any> => await obs?.send("GetStats");
const getInfo = async (): Promise<any> => await obs?.send("GetVideoInfo");

evntCom.expose("getVersion", getVersion);
evntCom.expose("getStats", getStats);
evntCom.expose("getInfo", getInfo);

// Scenes
const sceneGetCurrent = async (): Promise<any> =>
  await obs?.send("GetCurrentScene");
const sceneSetCurrent = async (scene: string): Promise<any> =>
  await obs?.send("SetCurrentScene", { "scene-name": scene });

evntCom.expose("sceneGetCurrent", sceneGetCurrent);
evntCom.expose("sceneSetCurrent", sceneSetCurrent);

// Sources
const sourceGetSettings = async (
  sourceName: string,
  sourceType?: string
): Promise<any> =>
  await obs?.send("GetSourceSettings", { sourceName, sourceType });
const sourceSetSettings = async (
  sourceName: string,
  sourceSettings: {},
  sourceType?: string
): Promise<any> =>
  await obs?.send("SetSourceSettings", {
    sourceName,
    sourceSettings,
    sourceType,
  });
const sourceGetVolume = async (
  source: string,
  useDecibel?: boolean
): Promise<any> => await obs?.send("GetVolume", { source, useDecibel });
const sourceSetVolume = async (
  source: string,
  volume: number,
  useDecibel?: boolean
): Promise<any> => await obs?.send("SetVolume", { source, useDecibel, volume });
const sourceGetMute = async (source: string): Promise<any> =>
  await obs?.send("GetMute", { source });
const sourceSetMute = async (source: string, mute: boolean): Promise<any> =>
  await obs?.send("SetMute", { source, mute });
const sourceMuteToggle = async (source: string): Promise<any> =>
  await obs?.send("ToggleMute", { source });

evntCom.expose("sourceGetSettings", sourceGetSettings);
evntCom.expose("sourceSetSettings", sourceSetSettings);
evntCom.expose("sourceGetVolume", sourceGetVolume);
evntCom.expose("sourceSetVolume", sourceSetVolume);
evntCom.expose("sourceGetMute", sourceGetMute);
evntCom.expose("sourceSetMute", sourceSetMute);
evntCom.expose("sourceMuteToggle", sourceMuteToggle);

// text

const textGDIGetSettings = async (source: string): Promise<any> =>
  await obs?.send("GetTextGDIPlusProperties", { source });
const textGDISetSettings = async (source: string, settings: {}): Promise<any> =>
  await obs?.send("SetTextGDIPlusProperties", { source, ...settings });
const textFreeGetSettings = async (source: string): Promise<any> =>
  await obs?.send("GetTextFreetype2Properties", { source });
const textFreeSetSettings = async (
  source: string,
  settings: {}
): Promise<any> =>
  await obs?.send("SetTextFreetype2Properties", { source, ...settings });

evntCom.expose("textGDIGetSettings", textGDIGetSettings);
evntCom.expose("textGDISetSettings", textGDISetSettings);
evntCom.expose("textFreeGetSettings", textFreeGetSettings);
evntCom.expose("textFreeSetSettings", textFreeSetSettings);

// filter
const filterGetSettings = async (
  source: string,
  filter: string
): Promise<any> =>
  await obs?.send("GetSourceFilterInfo", {
    sourceName: source,
    filterName: filter,
  });
const filterSetSettings = async (
  source: string,
  filter: string,
  settings: {}
): Promise<any> =>
  await obs?.send("SetSourceFilterSettings", {
    sourceName: source,
    filterName: filter,
    filterSettings: settings,
  });
const filterSetVisibility = async (
  source: string,
  filter: string,
  enable: boolean
): Promise<any> =>
  await obs?.send("SetSourceFilterVisibility", {
    sourceName: source,
    filterName: filter,
    filterEnabled: enable,
  });
const filterToggleVisibility = async (
  source: string,
  filter: string
): Promise<any> => {
  const { enabled } = await filterGetSettings(source, filter);
  return await filterSetVisibility(source, filter, !enabled);
};

evntCom.expose("filterGetSettings", filterGetSettings);
evntCom.expose("filterSetSettings", filterSetSettings);
evntCom.expose("filterSetVisibility", filterSetVisibility);
evntCom.expose("filterToggleVisibility", filterToggleVisibility);

// Scene Items

const sourceItemGetSettings = async (
  scene: string,
  itemName: string
): Promise<any> =>
  await obs.send("GetSceneItemProperties", {
    "scene-name": scene,
    item: { name: itemName },
  });
const sceneItemSetSettings = async (
  scene: string,
  itemName: string,
  settings: {}
): Promise<any> =>
  await obs.send("SetSceneItemProperties", {
    "scene-name": scene,
    item: { name: itemName },
    position: {},
    bounds: {},
    scale: {},
    crop: {},
    ...settings,
  });

const sourceItemSetVisibility = async (
  scene: string,
  itemName: string,
  visibility: boolean
): Promise<any> => {
  return await obs.send("SetSceneItemProperties", {
    "scene-name": scene,
    item: { name: itemName },
    position: {},
    bounds: {},
    scale: {},
    crop: {},
    visible: visibility,
  });
};

const sourceItemVisibilityToggle = async (
  scene: string,
  itemName: string
): Promise<any> => {
  const { visible } = await sourceItemGetSettings(scene, itemName);
  return await obs.send("SetSceneItemProperties", {
    "scene-name": scene,
    item: { name: itemName },
    visible: !visible,
    position: {},
    bounds: {},
    scale: {},
    crop: {},
  });
};

const sourceItemSetScale = async (
  scene: string,
  itemName: string,
  x: number,
  y: number
): Promise<any> => {
  return await obs.send("SetSceneItemProperties", {
    "scene-name": scene,
    item: { name: itemName },
    scale: { x, y },
    position: {},
    bounds: {},
    crop: {},
  });
};

const sourceItemSetPosition = async (
  scene: string,
  itemName: string,
  x: number,
  y: number
): Promise<any> => {
  return await obs.send("SetSceneItemProperties", {
    "scene-name": scene,
    item: { name: itemName },
    position: { x, y },
    bounds: {},
    scale: {},
    crop: {},
  });
};

const sourceItemSetRotation = async (
  scene: string,
  itemName: string,
  rotation: number
): Promise<any> => {
  return await obs.send("SetSceneItemProperties", {
    "scene-name": scene,
    item: { name: itemName },
    rotation,
    position: {},
    bounds: {},
    scale: {},
    crop: {},
  });
};

evntCom.expose("sourceItemGetSettings", sourceItemGetSettings);
evntCom.expose("sceneItemSetSettings", sceneItemSetSettings);
evntCom.expose("sourceItemSetVisibility", sourceItemSetVisibility);
evntCom.expose("sourceItemVisibilityToggle", sourceItemVisibilityToggle);
evntCom.expose("sourceItemSetScale", sourceItemSetScale);
evntCom.expose("sourceItemSetPosition", sourceItemSetPosition);
evntCom.expose("sourceItemSetRotation", sourceItemSetRotation);

// Streaming

const streamingGetStatus = async (): Promise<any> =>
  await obs.send("GetStreamingStatus");
const streamingToggle = async (): Promise<any> =>
  await obs.send("StartStopStreaming");
const streamingStart = async (): Promise<any> =>
  await obs.send("StartStreaming", {});
const streamingStop = async (): Promise<any> => await obs.send("StopStreaming");

evntCom.expose("streamingGetStatus", streamingGetStatus);
evntCom.expose("streamingToggle", streamingToggle);
evntCom.expose("streamingStart", streamingStart);
evntCom.expose("streamingStop", streamingStop);

// Recording

const recordingGetStatus = async (): Promise<any> =>
  await obs.send("GetStreamingStatus");
const recordingToggle = async (): Promise<any> =>
  await obs.send("StartStopRecording");
const recordingStart = async (): Promise<any> =>
  await obs.send("StartRecording");
const recordingStop = async (): Promise<any> => await obs.send("StopRecording");
const recordingPause = async (): Promise<any> =>
  await obs.send("PauseRecording");
const recordingResume = async (): Promise<any> =>
  await obs.send("ResumeRecording");

evntCom.expose("recordingGetStatus", recordingGetStatus);
evntCom.expose("recordingToggle", recordingToggle);
evntCom.expose("recordingStart", recordingStart);
evntCom.expose("recordingStop", recordingStop);
evntCom.expose("recordingPause", recordingPause);
evntCom.expose("recordingResume", recordingResume);
