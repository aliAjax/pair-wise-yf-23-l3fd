import { useEffect } from "react";
import { useAppDispatch } from "../stores/hooks";
import { ensureSeedData, resetSeedData } from "../api/localDb";
import { loadFixtures } from "../stores/FixtureStore";
import { loadCueScenes } from "../stores/CueSceneStore";
import { loadTracks } from "../stores/TimelineTrackStore";
import { loadShowProjects } from "../stores/ShowProjectStore";

/**
 * 应用启动引导：确保 IndexedDB 已注入种子数据，再把四类实体装进独立 store。
 * 组件禁止各自散读 IndexedDB，统一走这里。
 */
export function useIndexedDbStore() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;
    ensureSeedData()
      .then(async () => {
        if (cancelled) return;
        await Promise.all([
          dispatch(loadFixtures()),
          dispatch(loadCueScenes()),
          dispatch(loadTracks()),
          dispatch(loadShowProjects())
        ]);
      })
      .catch((error) => {
        // 引导失败由各 store 的 error 状态呈现，这里不静默吞
        console.error("IndexedDB bootstrap failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const reseed = async () => {
    await resetSeedData();
    await Promise.all([
      dispatch(loadFixtures()),
      dispatch(loadCueScenes()),
      dispatch(loadTracks()),
      dispatch(loadShowProjects())
    ]);
  };

  return { reseed };
}
