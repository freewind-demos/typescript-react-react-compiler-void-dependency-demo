import { useSyncExternalStore } from "react";

// 一个极小的外部 store：一个不断自增的版本号。
// 它模拟真实项目里的「运行时库」——界面通过 hook 订阅它，计算体则直接去读它当前的值。

let version = 0;
const listeners = new Set<() => void>();

export function bumpVersion(): void {
  version += 1;
  // 通知订阅者，useSyncExternalStore 会因此触发重渲染。
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readVersion(): number {
  return version;
}

// 订阅用：返回当前版本号，值变了会重渲染。
export function useVersion(): number {
  return useSyncExternalStore(subscribe, readVersion, readVersion);
}

// 与订阅无关的另一条路：计算体自己去读当前值。
// 这就是真实 bug 的形状——值会变，但读取它这件事不出现在任何参数里。
export function readVersionDirectly(): number {
  return version;
}

// 对照组的读取口：版本号作为参数传进来，因此这次调用「有依赖」。
// 函数体照样忽略它，只是为了演示「传进来」和「void 掉」的区别。
export function readVersionAt(_version: number): number {
  return version;
}
