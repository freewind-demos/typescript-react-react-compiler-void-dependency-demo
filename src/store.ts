import { useSyncExternalStore } from "react";

// 外部 store 只做一件事：维护一个自增的点击计数。
// 界面通过 hook 订阅它，用来触发重渲染。

let version = 0;
const listeners = new Set<() => void>();

export function bumpVersion(): void {
  version += 1;
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

// 订阅用：返回当前点击次数，值变了会重渲染。
export function useVersion(): number {
  return useSyncExternalStore(subscribe, readVersion, readVersion);
}

// 计算体自己去读「当下时间」——没有参数，纯读取外部状态。
export function readNow(): number {
  return Date.now();
}

// 对照组的读取口：把点击次数当参数传进来，于是这次调用「有依赖」。
export function readNowAt(_version: number): number {
  return Date.now();
}
