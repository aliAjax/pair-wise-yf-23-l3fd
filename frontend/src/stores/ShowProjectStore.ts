import { create } from "zustand";
import { listShowProject } from "../api/ShowProject";
import type { ShowProject } from "../types/ShowProject";

type State = { rows: ShowProject[]; loading: boolean; load: () => Promise<void> };

export const useShowProjectStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listShowProject(), loading: false });
  }
}));
