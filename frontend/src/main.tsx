import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import { store } from "./stores/store";
import { routes } from "./router/routes";
import { useHashRoute } from "./router/useHashRoute";
import { useIndexedDbStore } from "./hooks/useIndexedDbStore";
import { FixturesPage } from "./pages/FixturesPage";
import { CuesPage } from "./pages/CuesPage";
import { TimelinePage } from "./pages/TimelinePage";
import { PreviewPage } from "./pages/PreviewPage";
import "./styles.css";

function Shell() {
  useIndexedDbStore();
  const [active, navigate] = useHashRoute();

  return (
    <div className="flex min-h-screen bg-stage-bg text-stage-paper">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r-4 border-stage-gold bg-[#1c2820] p-5">
        <div className="mb-6 text-lg font-extrabold leading-tight">
          舞台灯光
          <br />
          编排模拟器
        </div>
        <nav className="grid gap-1">
          {routes.map((route) => (
            <button
              key={route.route}
              type="button"
              onClick={() => navigate(route.route)}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                active === route.route ? "bg-stage-paper font-bold text-[#1c2820]" : "text-[#b9c2b3] hover:bg-white/10"
              }`}
            >
              {route.name}
            </button>
          ))}
        </nav>
        <p className="mt-auto text-[10px] leading-relaxed text-[#6f7a6b]">
          数据保存在浏览器 IndexedDB
          <br />
          stage-light · v1
        </p>
      </aside>
      <main className="min-w-0 flex-1 p-6">{renderPage(active)}</main>
    </div>
  );
}

function renderPage(route: string) {
  switch (route) {
    case "/fixtures":
      return <FixturesPage />;
    case "/cues":
      return <CuesPage />;
    case "/timeline":
      return <TimelinePage />;
    case "/preview":
      return <PreviewPage />;
    default:
      return <TimelinePage />;
  }
}

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <Shell />
  </Provider>
);
