import { useMemo } from "react";
import { readNow, readNowAt, useClickCount } from "./store";

// 三个面板只显示一项：缓存里留下的时间戳。
// 它不变＝那段计算没重跑；它跟着点＝重算了。

/**
 * 被测写法：计算体直接读当下时间，依赖里写上点击次数，
 * 但点击次数只被 `void` 读一次，对返回值没有影响。
 */
export function VoidDepPanel() {
  const clickCount = useClickCount();

  const snapshot = useMemo(() => {
    // 本次实验的主角：我们依赖它刷新memo得到当前新时间
    void clickCount;
    console.log("### clickCount", clickCount);
    return readNow();
  }, [
    // 显式依赖
    clickCount
  ]);

  return (
    <section>
      <h2>void 依赖</h2>
      <p>快照时间：{snapshot}</p>
    </section>
  );
}

/**
 * 同一段写法，但声明 "use no memo"：编译器跳过这个组件，
 * 手写的依赖按字面意思生效。
 */
export function NoMemoPanel() {
  "use no memo";
  const clickCount = useClickCount();

  const snapshot = useMemo(() => {
    void clickCount;
    return readNow();
  }, [clickCount]);

  return (
    <section>
      <h2>void 依赖 + 跳过编译</h2>
      <p>快照时间：{snapshot}</p>
    </section>
  );
}

/**
 * 对照组：点击次数作为参数传进读取函数。
 * 函数体忽略它，但这次调用「有依赖」，次数一变就重算。
 */
export function PassedDepPanel() {
  const clickCount = useClickCount();
  const now = readNowAt(clickCount);

  return (
    <section>
      <h2>参数传参</h2>
      <p>快照时间：{now}</p>
    </section>
  );
}
