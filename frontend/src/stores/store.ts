import { configureStore } from "@reduxjs/toolkit";
import { fixtureReducer } from "./FixtureStore";
import { cueSceneReducer } from "./CueSceneStore";
import { timelineTrackReducer } from "./TimelineTrackStore";
import { showProjectReducer } from "./ShowProjectStore";
import { playbackReducer } from "./PlaybackStore";

export const store = configureStore({
  reducer: {
    fixture: fixtureReducer,
    cueScene: cueSceneReducer,
    timelineTrack: timelineTrackReducer,
    showProject: showProjectReducer,
    playback: playbackReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
