# React Compiler 下 `void` 依赖实验

## 简介

在 React Compiler 开启的构建里，如果 `useMemo` 的计算体只是 `void` 读了一下某个值、把它写进依赖数组，这个依赖到底还算不算数？

这个 Demo 把两种写法并排放着，一边是「只 `void` 读一次」，一边是「真的把值传给一个函数」，看编译产物和运行时结果差在哪里。

## 快速开始

### 环境要求

Node.js 20 以上，pnpm。

### 运行

```bash
pnpm install
pnpm run inspect   # 打印编译产物里的依赖判断
pnpm run dev       # 打开页面，点按钮让版本号 +1
```

## 注意事项

开发模式默认**不会**经过 React Compiler：`@vitejs/plugin-react` 的 `babel` 选项只作用于生产构建，dev 直接发源码。所以这个 Demo 在 `vite.config.ts` 里自己接了一步编译，保证 `pnpm run dev` 和 `pnpm run build` 跑的是同一份编译结果。不接这一步，页面上永远看不到问题，只有打包后的产物才会犯病。


判断依据是两个数字，不是感觉：

- `快照版本` / `当前读数`：计算发生时读到的外部值。
- `当前版本`：订阅得到的版本号，每点一次按钮加一。

「void 依赖」面板里的快照会一直停在初始值，而「当前版本」照常增长——两者一旦不等，就说明那段计算没有再执行过。

`compiled-panels.js` 是 `pnpm run inspect` 生成的编译结果，可以直接翻看。

## 教程

### 1. 背景

React Compiler 会把组件里的计算换成带缓存槽的形式：它自己推断「这段结果依赖哪些值」，然后写成 `if ($[0] !== dep) { 重算 }`。

问题就出在这里：当依赖是手写的、而计算体又没有真正使用某个值时，编译器不会按你写的依赖来判断，而是按它推断出来的判断。

### 2. Demo 原理

外部 store 里只有一个自增的版本号。组件通过 hook 订阅它，所以版本一变组件就重渲染。

两种面板的差别只在计算体：

- `void version;` 读一下丢掉。
- `readVersionAt(version)` 把版本号当参数传进去，函数体照样忽略它。

两者语义上完全一样，都不影响结果；差别只在「这个值有没有参与计算」。

### 3. 编译结果

`void` 版：计算被折成一次，版本号连影子都没有。

```js
const version = useVersion();
let t0;
if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
  t0 = readVersionDirectly();
  $[0] = t0;
}
const snapshot = t0;
```

传参版：判断里就是版本号，版本一变就重算。

```js
const version = useVersion();
let t0;
if ($[0] !== version) {
  t0 = readVersionAt(version);
  $[0] = version;
  $[1] = t0;
}
```

### 4. 实测结果

连点三次按钮后：

```
void 依赖    快照版本：0   当前版本：3
参数传参    当前读数：3   当前版本：3
```

「void 依赖」面板重渲染了三次，但那段计算一次都没重跑，快照停在初始值。

### 5. 结论

- 依赖数组里写了没用，编译器按计算结果的实际来源判断。
- 想让某个值成为依赖，必须让它参与计算：当参数传、参与运算、参与拼接都行。
- 只 `void` 一下，等于没写。

### 6. 顺带发现的第二件事

对照组最初写成「不缓存，每次渲染直接调用读取函数」，编译后同样被冻住：

```js
if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
  t0 = readVersionDirectly();
  $[0] = t0;
}
```

参数不变的调用会被缓存，所以「直接读外部可变状态」在编译器下本身就不安全。读取外部状态要么走订阅拿到的值，要么把「什么时候该重读」的信号当参数传进去。
