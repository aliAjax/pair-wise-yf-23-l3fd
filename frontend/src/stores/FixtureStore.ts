import { create } from "zustand";
import { listFixture } from "../api/Fixture";
import type { Fixture } from "../types/Fixture";

type State = { rows: Fixture[]; loading: boolean; load: () => Promise<void> };

export const useFixtureStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listFixture(), loading: false });
  }
}));
