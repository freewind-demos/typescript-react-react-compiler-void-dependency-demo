# React Compiler 下 `void` 依赖实验

## 简介

在开了 React Compiler 的构建里，如果 `useMemo` 的计算体只是 `void` 读了一下某个值、把它写进依赖数组，这条依赖还算不算数？

这个 Demo 把三种写法并排放着：只 `void` 读一次、同样写法但跳过编译器、把值当参数传进计算。看编译产物和页面上的时间戳差在哪。

## 快速开始

### 环境要求

Node.js 20 以上，pnpm。

### 运行

```bash
pnpm install
pnpm run inspect   # 打印编译产物里的依赖判断
pnpm run dev       # 打开页面，点按钮触发重渲染（按钮上的数字是触发次数）
```

## 注意事项

开发模式默认**不会**经过 React Compiler：`@vitejs/plugin-react` 的 `babel` 选项只作用于生产构建，dev 直接发源码。所以这个 Demo 在 `vite.config.ts` 里自己接了一步编译，保证 `pnpm run dev` 和 `pnpm run build` 跑的是同一份编译结果。不接这一步，页面上永远看不到问题，只有打包后的产物才会犯病。

判断依据是面板上那个**快照时间**：

- 它停着不动，说明那段计算从挂载之后再没跑过（按钮上的次数照涨）。
- 它跟着每次点击变，说明计算真的重跑了。

`compiled-panels.js` 是 `pnpm run inspect` 生成的编译结果，可以直接翻看。

## 教程

### 1. 背景

React Compiler 会把组件里的计算换成带缓存槽的形式：它自己推断「这段结果依赖哪些值」，再写成 `if ($[0] !== dep) { 重算 }`。

问题出在这里：依赖是你手写的，而编译器按它自己推断出来的依赖判断。

### 2. Demo 原理

外部 store 里只有一个计数。组件通过 hook 订阅它，点一次按钮就重渲染一次。

计算体干的事很普通：读一下当前时间 `Date.now()`。这件事本身没有参数，所以编译器看不出它跟那个计数有关系。

三种写法的差别只在「那个计数有没有参与」：

- `void clickCount;` 读一下丢掉。
- 同样的写法加 `"use no memo"`，编译器不碰这个组件。
- `readNowAt(clickCount)` 把计数当参数传进去，函数体照样忽略它。

### 3. 编译结果

`void` 版：读取被折成一次，判断里没有那个计数。

```js
const clickCount = useClickCount();
let t0;
if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
  t0 = readNow();
  $[0] = t0;
} else {
  t0 = $[0];
}
const snapshot = t0;
```

传参版：判断就是那个计数，每点一次都重算。

```js
const clickCount = useClickCount();
let t0;
if ($[0] !== clickCount) {
  t0 = readNowAt(clickCount);
  $[0] = clickCount;
  $[1] = t0;
} else {
  t0 = $[1];
}
const now = t0;
```

跳过编译的那版保留手写 `useMemo`，没有缓存槽。

### 4. 实测结果

连点三次之后：

```
void 依赖              1794932289441
void 依赖 + 跳过编译    1794932291562
参数传参               1794932291562
```

第一行是挂载那一刻，三次点击都没能改写它；后两行是最后一次点击的时刻。

### 5. 跳过编译器做对照

三块面板里只有第二块加了 `"use no memo"`。同样是 `void` 写法，编译器碰与不碰，结果就分开了。

所以这不是 `useMemo` 的语义问题，而是编译器把这条依赖吃掉了。

`"use no memo"` 只用于对照；日常代码应该让值真正参与计算，而不是关掉优化。

### 6. 这是编译器的已知 bug

官方规则 `preserve-manual-memoization` 的说法是：手写的 `useMemo` 会被保留，编译器推断的依赖必须覆盖手写的，覆盖不了就整段跳过不编译。

实测不是这样：编译器报的是 `CompileSuccess`，没有任何违规诊断，手写依赖照样丢掉。

相关 issue：

- [react#33559 Compiler optimizes away useMemo with manual dependencies](https://github.com/facebook/react/issues/33559)（open）
- [react#29892 Compiler incorrectly removes memoization of an expensive operation in useMemo](https://github.com/facebook/react/issues/29892)（open）
- [react#34262 “The inferred dependencies did not match...” references Compiler’s internal variables](https://github.com/facebook/react/issues/34262)（open）

同类问题还有几处（memoization 随代码行序变化、嵌套调用下不一致等），都还开着。结论：这条行为不能依赖。

### 7. 结论

- 依赖数组里写了没用，编译器按计算结果的实际来源判断。
- 想让某个值成为依赖，必须让它参与计算：当参数传、参与运算、参与拼接都行。
- 只 `void` 一下，等于没写。
- 计算体不要直接读外部可变状态：参数不变的调用会被缓存，读了也白读。

### 8. 顺带发现的第二件事

对照组最初写成「不缓存，每次渲染直接调用读取函数」，编译后同样被冻住：

```js
if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
  t0 = readNow();
  $[0] = t0;
}
```

参数不变的调用会被缓存，所以「直接读外部状态」在编译器下本身就不安全。读取外部状态要么走订阅拿到的值，要么把「什么时候该重读」的信号当参数传进去。
