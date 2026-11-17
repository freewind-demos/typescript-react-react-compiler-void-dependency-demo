import { useMemo } from "react";
import { readVersionAt, readVersionDirectly, useVersion } from "./store";

// 判据只看两个数字：面板上显示的「快照」和「当前版本」。
// 渲染保持纯净，否则编译器会整段跳过，实验就失效了。

/**
 * 被测写法：计算体直接去读外部可变值，依赖里写上版本号，
 * 但版本号只被 `void` 读一次，对返回值没有影响。
 */
export function VoidDepPanel() {
  // 版本一变就重渲染，这一步是正常的。
  const version = useVersion();

  const snapshot = useMemo(() => {
    // 本次实验的主角：读了一下，然后丢掉。
    void version;
    // 真正的取值发生在这一步，它读的是外部可变状态，不在任何参数里。
    return readVersionDirectly();
  }, [version]);

  return (
    <section>
      <h2>void 依赖</h2>
      <p>快照版本：{snapshot}</p>
      <p>当前版本：{version}</p>
    </section>
  );
}

/**
 * 对照组：把版本号当成参数传进读取函数。
 * 函数体同样忽略这个参数，但版本号「参与了这次调用」，
 * 于是版本一变，这次读取就会重算。
 */
export function PassedDepPanel() {
  const version = useVersion();
  const live = readVersionAt(version);

  return (
    <section>
      <h2>参数传参</h2>
      <p>当前读数：{live}</p>
      <p>当前版本：{version}</p>
    </section>
  );
}
