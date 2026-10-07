import { useEffect } from "react";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { CueCard } from "../components/common/CueCard";

export function CuesPage() {
  const scenes = useCueSceneStore((state) => state.rows);
  const loading = useCueSceneStore((state) => state.loading);
  const load = useCueSceneStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">stage-light · 场景编辑</p>
          <h1>灯光场景</h1>
        </div>
      </header>
      <section className="panel">
        {loading && <div className="empty">场景加载中…</div>}
        <div className="cue-grid">
          {scenes.map((scene) => (
            <CueCard key={scene.id} scene={scene} />
          ))}
        </div>
      </section>
    </main>
  );
}
