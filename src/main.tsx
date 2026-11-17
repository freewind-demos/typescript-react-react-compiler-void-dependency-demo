import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NoMemoPanel, PassedDepPanel, VoidDepPanel } from "./panels";
import { bumpVersion } from "./store";

// 页面只放一件事：点一下让版本号加一，看两边计数怎么变。
function App() {
  return (
    <main>
      <button type="button" onClick={bumpVersion}>
        点击 +1
      </button>
      <VoidDepPanel />
      <NoMemoPanel />
      <PassedDepPanel />
    </main>
  );
}

// StrictMode 会让开发环境多跑一遍渲染，便于暴露副作用，不影响本实验的判断依据。
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
