import { create } from "zustand";
import { listCueScene } from "../api/CueScene";
import type { CueScene } from "../types/CueScene";

type State = { rows: CueScene[]; loading: boolean; load: () => Promise<void> };

export const useCueSceneStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listCueScene(), loading: false });
  }
}));
