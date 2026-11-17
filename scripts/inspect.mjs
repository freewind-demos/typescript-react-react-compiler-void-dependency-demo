import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as babel from "@babel/core";

// 这个脚本不参与页面运行，它只做一件事：把 panels.tsx 交给 React Compiler 编译，
// 然后把生成的代码打出来，直接看两个面板各自的「失效判断」里比较了哪些值。

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "..", "src", "panels.tsx");
const outputPath = join(here, "..", "compiled-panels.js");

const source = readFileSync(sourcePath, "utf8");

const result = babel.transformSync(source, {
  filename: sourcePath,
  babelrc: false,
  configFile: false,
  // 只做必须的两件事：剥掉 TS 类型、把 JSX 换成函数调用。
  // Babel 8 里 TS 预设不再接受 isTSX/allExtensions，JSX 光看 .tsx 扩展名就能识别。
  presets: ["@babel/preset-typescript", ["@babel/preset-react", { runtime: "automatic" }]],
  // 真正的主角。
  plugins: [["babel-plugin-react-compiler"]],
});

if (!result?.code) {
  throw new Error("编译没有产出代码");
}

writeFileSync(outputPath, result.code);

// 把两个面板的失效判断单独摘出来，省得在整份产物里找。
const lines = result.code.split("\n");
for (const [index, line] of lines.entries()) {
  if (!/if \(\$\[\d+\] !==/.test(line)) continue;
  console.log(`第 ${index + 1} 行：${line.trim()}`);
}

console.log(`\n完整产物：${outputPath}`);
