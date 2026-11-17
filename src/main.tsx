import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NoMemoPanel, PassedDepPanel, VoidDepPanel } from "./panels";
import { bumpVersion, useVersion } from "./store";

// 页面只放一件事：点一下让计数加一，看三块面板的时间戳怎么变。
function App() {
  // 按钮上的数字就是触发次数，由同一个 store 提供。
  const version = useVersion();

  return (
    <main>
      <button type="button" onClick={bumpVersion}>
        触发重渲染 {version}
      </button>
      <VoidDepPanel />
      <NoMemoPanel />
      <PassedDepPanel />
    </main>
  );
}

// StrictMode 会在开发环境多跑一遍渲染，不影响判断依据：看的是时间戳有没有变。
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
