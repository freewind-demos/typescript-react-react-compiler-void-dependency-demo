import { useMemo } from "react";
import { readNow, readNowAt, useVersion } from "./store";

// 三个面板显示同样两项：缓存里留下的时间戳、当前点击次数。
// 时间戳不变＝那段计算没重跑；时间戳跟着点＝重算了。

/**
 * 被测写法：计算体直接读当下时间，依赖里写上点击次数，
 * 但点击次数只被 `void` 读一次，对返回值没有影响。
 */
export function VoidDepPanel() {
  const version = useVersion();

  const snapshot = useMemo(() => {
    // 本次实验的主角：读了一下，然后丢掉。
    void version;
    return readNow();
  }, [version]);

  return (
    <section>
      <h2>void 依赖</h2>
      <p>快照时间：{snapshot}</p>
      <p>点击次数：{version}</p>
    </section>
  );
}

/**
 * 同一段写法，但声明 "use no memo"：编译器跳过这个组件，
 * 手写的依赖按字面意思生效。
 */
export function NoMemoPanel() {
  "use no memo";
  const version = useVersion();

  const snapshot = useMemo(() => {
    void version;
    return readNow();
  }, [version]);

  return (
    <section>
      <h2>void 依赖 + 跳过编译</h2>
      <p>快照时间：{snapshot}</p>
      <p>点击次数：{version}</p>
    </section>
  );
}

/**
 * 对照组：点击次数作为参数传进读取函数。
 * 函数体忽略它，但这次调用「有依赖」，次数一变就重算。
 */
export function PassedDepPanel() {
  const version = useVersion();
  const now = readNowAt(version);

  return (
    <section>
      <h2>参数传参</h2>
      <p>快照时间：{now}</p>
      <p>点击次数：{version}</p>
    </section>
  );
}
