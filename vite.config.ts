import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import * as babel from "@babel/core";

// React Compiler 只在构建阶段生效的话，开发页面就看不出问题。
// 这里自己接管这一步：开发与构建都先过一遍编译器，保证页面跑的就是编译后的代码。
function reactCompiler(): Plugin {
  return {
    name: "react-compiler",
    enforce: "pre",
    async transform(code, id) {
      // 只看项目自己的 TS/TSX，依赖和虚拟模块一律跳过。
      if (!/\.[jt]sx?$/.test(id) || id.includes("/node_modules/")) return null;

      const result = babel.transformSync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        // 剥掉 TS 类型，JSX 交给 React 17+ 的自动运行时。
        presets: [
          ["@babel/preset-typescript"],
          ["@babel/preset-react", { runtime: "automatic", development: true }],
        ],
        // 主角：编译器本体。
        plugins: [["babel-plugin-react-compiler"]],
        sourceMaps: true,
      });

      if (!result?.code) return null;
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  plugins: [reactCompiler(), react()],
  server: {
    // 样式直接从依赖目录读取，省掉额外拷贝或构建步骤。
    fs: { allow: ["."] },
  },
});
