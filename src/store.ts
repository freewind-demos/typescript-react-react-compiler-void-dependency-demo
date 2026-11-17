import { useSyncExternalStore } from "react";

// 外部 store 只做一件事：维护一个自增的点击计数。
// 界面通过 hook 订阅它，用来触发重渲染。

let clickCount = 0;
const listeners = new Set<() => void>();

export function bumpClickCount(): void {
  clickCount += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readClickCount(): number {
  return clickCount;
}

// 订阅用：返回当前点击次数，值变了会重渲染。
export function useClickCount(): number {
  return useSyncExternalStore(subscribe, readClickCount, readClickCount);
}

// 计算体自己去读「当下时间」——没有参数，纯读取外部状态。
export function readNow(): number {
  return Date.now();
}

// 对照组的读取口：把点击次数当参数传进来，于是这次调用「有依赖」。
export function readNowAt(_clickCount: number): number {
  return Date.now();
}
