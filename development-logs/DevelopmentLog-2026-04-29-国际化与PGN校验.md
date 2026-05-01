# node-red-contrib-chinese-chess Development Log / 开发日志

## 2026年4月29日 - Internationalization & PGN Validation Feature / 国际化与 PGN 校验功能开发

---

## 今日开发目标 / Today's Development Goals

1. ✅ Remove WebSocket (ws-server) functionality completely removed / ✅ 彻底去除 WebSocket (ws-server) 功能
2. ✅ All development logs converted to bilingual Chinese/English format / ✅ 所有开发日志转换为中英双语版本
3. ✅ Full node UI internationalization (English only) / ✅ 完整节点 UI 国际化（纯英文）
4. ✅ PGN move validation system / ✅ PGN 走法校验系统

---

## 完成的工作 / Completed Work

### 1. 移除 WebSocket Server 功能移除 / 1. WebSocket Server Feature Removal

**操作 / Action：
- 完全删除整个 `ws-server` 目录
- Removed entire `ws-server` directory completely
- 包含 server.js、chess-core.js、package.json、测试文件等
- Including server.js, chess-core.js, package.json, test files, etc.

---

### 2. 开发日志国际化 / 2. Development Log Internationalization

**转换的日志文件 / Converted Log Files：
| 文件名 / File Name | 说明 / Description |
|---------------------|---------------------|
| `2026-04-25-同列多棋子记谱功能.md` | Multi-piece same column notation feature / 同列多棋子记谱功能 |
| `开发经验总结.md` | Development experience summary / 开发经验总结 |
| `开发日志-2026-04-21.md` | Development log 2026-04-21 / 开发日志 |
| `调试总结.md` | Debugging experience summary / 调试总结 |

**统一格式 / Unified Format：
- 所有标题中英双语 / All titles bilingual Chinese/English
- 技术术语保留英文（如 FEN、PGN、WebSocket 等
- Technical terms in English (FEN, PGN, WebSocket, etc.)
- 代码注释保持英文 / Code comments in English
- 说明文字中英对照 / Explanatory text bilingual

---

### 3. 节点 UI 全面国际化 / 3. Node UI Full Internationalization

#### 节点配置页翻译 / Node Configuration Page Translation

**Original Chinese / 原中文 | **New English / 新英文 |
|---|---|
| 分组 | Group |
| 尺寸 | Size |
| 名称 | Name |
| 棋盘宽度 | Board Width |
| 棋盘高度 | Board Height |
| 初始视角 | Orientation |
| 红方在下 | Red at Bottom |
| 黑方在下 | Black at Bottom |
| 显示控制按钮 | Show Controls |

#### 控制按钮翻译 / Control Buttons Translation
| Original Chinese / 原中文 | New English / 新英文 |
|---|---|
| 上一步 | Previous |
| 下一步 | Next |
| 重置 | Reset |

#### 提示信息翻译 / Info Messages Translation
| Original Chinese / 原中文 | New English / 新英文 |
|---|---|
| 步数 | Move |
| 轮到红方 | Turn: Red |
| 轮到黑方 | Turn: Black |
| 已加载剧本 | Script loaded |
| ✅ 已加载 FEN 局面 | FEN loaded |
| ❌ FEN 加载失败，请检查格式 | FEN load failed, invalid format |
| 非法走法 | Invalid move |
| 无法解析走法 | Cannot parse move |
| 起点无对应棋子 | No piece at start position |
| 不符合规则 | Invalid rule |

---

### 4. PGN 合法性校验功能 / 4. PGN Validation Feature

#### 功能说明 / Feature Description
新增完整的 PGN（Portable Game Notation）走法校验系统，支持：
New complete PGN move validation system, supports:
- 着法格式合法性校验 / Move format validity check
- 棋子类型识别 / Piece type recognition
- 动作类型识别 / Action type recognition
- 规则合法性验证 / Rule validity verification
- 详细错误信息输出 / Detailed error message output
- 最多显示前3条错误，超出显示总数 / Shows first 3 errors, total count if exceeded

#### 校验逻辑 / Validation Logic

```javascript
// PGN 格式解析流程 / PGN Parsing Flow
1. Input format check / 输入格式检查
├─ Empty/non-string → 直接返回错误 / Empty/non-string → return error immediately
├─ Invalid piece char → error / 非法棋字 → 返回错误
├─ Invalid action char → error / 非法动作字 → 返回错误
└─ Invalid length (not 4-5 chars → error
                           / 非法长度（非4-5字符）→ 返回错误

2. Coordinate parsing / 坐标解析
├─ Parse start position coordinate / 解析起点坐标
├─ Parse end position coordinate / 解析终点坐标
└─ Position boundary check / 位置边界检查

3. Rule validation / 规则校验
├─ Check piece exists at start / 检查起点有棋子
└─ Validate move conforms to piece rules / 验证走法符合棋子规则
```

#### 输出格式 / Output Format

**Success / 成功：
```javascript
{
    payload: {
        success: true,
        loaded: 4,      // Valid moves count / 有效着法数
        total: 4,       // Total moves / 总着法数
        errors: []
    }
}
```

**Failure / 失败：**
```javascript
{
    payload: {
        success: false,
        errors: [
            "Move #1: '炮X平五' - Invalid piece character",
            "Move #2: '马8进99' - Move too long (max 5 chars)",
            "...and 2 more errors"
        ],
        errorMsg: "❌ PGN validation failed: 4 errors"
    }
}
```

---

## 开发过程中遇到的主要问题 / Key Issues Encountered During Development

### 问题 1：前端代码字符串引号嵌套导致语法错误 / Issue 1: String Quote Nesting Causing Syntax Error

**现象 / Symptom：**
```javascript
SyntaxError: Invalid or unexpected token (line:154)
```

**原因 / Root Cause：**
节点后端 JS 文件中的前端代码字符串数组中，引号嵌套错误：
Quote nesting error in frontend code string array in backend JS file:
```javascript
// 错误代码 / Wrong code:
'var errorMsg = "❌ PGN validation failed: " + result.errors.length + " errors";'

// 问题：外层已有单引号，内层又用双引号 + 结尾多了分号引号
// Problem: Already single quote outer layer, double quotes inner + extra semicolon quote at end
```

**解决方案 / Solution：**
1. 首先去除所有 emoji 符号（可能造成编码问题）
2. 统一引号格式
3. 仔细检查数组每行结尾的逗号位置
4. 使用 `node -c filename.js` 命令验证语法正确性

1. Remove all emoji symbols (may cause encoding issues)
2. Unify quote format
3. Carefully check comma position at end of each array line
4. Use `node -c filename.js` command to verify syntax correctness

---

### 问题 2：Game.loadPGN 不是全局方法 / Issue 2: Game.loadPGN is Not a Global Method

**现象 / Symptom：**
```javascript
window["ChineseChess"].loadPGN is not a function
```

**原因 / Root Cause：**
`loadPGN` 是 `Game` 实例的方法，不是 `ChineseChess` 全局对象的静态方法。
`loadPGN` is a method of `Game` instance, not a static method of global `ChineseChess` object.

**解决方案 / Solution：**
```javascript
// 错误调用 / Wrong call
var result = window["ChineseChess"].loadPGN(data.pgn);

// 正确调用 / Correct call
var result = game.loadPGN(data.pgn);
```

---

### 问题 3：Game.clone() 方法中 Board 构造函数访问问题 / Issue 3: Board Constructor Access Issue in Game.clone()

**现象 / Symptom：**
```javascript
new Board() is undefined
```

**原因 / Root Cause：**
`Board` 构造函数不在 `Game.prototype` 作用域内，不能直接访问。
`Board` constructor not within `Game.prototype` scope, cannot be accessed directly.

**解决方案 / Solution：**
```javascript
// 正确实现 / Correct implementation
Game.prototype.clone = function() {
    var cloned = createGame();  // 使用 createGame() 工厂函数
    // Use createGame() factory function
    ...
};
```

---

## 测试验证 / Testing & Verification

### 已通过的测试用例 / Test Cases Passed

| 测试项 / Test Item | 结果 / Result |
|---------------------|-------------|
| 节点配置页完整显示英文 | ✅ Config page fully English |
| 棋盘正常显示无报错 | ✅ Board displays without error |
| 按钮显示英文 Previous/Next/Reset | ✅ Buttons show English |
| 信息面板显示英文步数与轮次 | ✅ Info panel shows English move/turn |
| 合法 PGN 加载成功显示 | ✅ Valid PGN loads successfully |
| 非法 PGN 显示详细错误 | ✅ Invalid PGN shows detailed errors |
| Node-RED 无语法错误 | ✅ No Node-RED syntax errors |
| 刷新页面后棋盘状态保留 | ✅ Board state preserved after refresh |

---

## 关键技术要点 / Key Technical Points

| 序号 / No. | 技术要点 / Technical Point |
|-----------|----------------------------|
| 1 | 前端代码必须通过字符串数组方式传递给 `new Function()`，引号嵌套必须非常小心 / Frontend code must be passed to `new Function()` via string array, quote nesting needs extreme care |
| 2 | 节点 JS 修改后必须复制到 node_modules 并重启服务才生效，否则一直是旧代码 / Node JS changes must be copied to node_modules and service restarted, otherwise old code persists |
| 3 | Game.prototype 内的方法不能直接访问外部构造函数，必须通过工厂函数 createGame() / Methods inside Game.prototype cannot directly access external constructors, must use factory function createGame() |
| 4 | PGN 校验分三层：格式校验 → 坐标解析 → 规则验证 / PGN validation has 3 layers: format check → coordinate parsing → rule validation |
| 5 | 国际化时所有用户可见字符串都要翻译，包括 infoPanel 动态信息 / All user-visible strings must be translated including infoPanel dynamic messages |

---

## 项目当前状态 / Current Project Status

| 项目 / Item | 状态 / Status |
|-----------|-------------|
| 中文界面完全移除 | ✅ 100% English UI |
| PGN 校验功能完整可用 | ✅ Fully functional PGN validation |
| 所有日志双语版本完成 | ✅ All logs bilingual complete |
| WebSocket 功能完全移除 | ✅ WS feature fully removed |
| 节点无语法错误 | ✅ No syntax errors |
| 所有功能回归测试通过 | ✅ All features regression tested |

---

## 下一步计划 / Next Steps

1. 更多 PGN 格式兼容性增强（支持标准 PGN 头标签）
2. More PGN format compatibility enhancement (support standard PGN header tags)
3. 可选：自动检测 PGN 编码
4. Optional: auto-detect PGN encoding
5. 走法动画优化（已计划中）
6. Move animation optimization (planned)

---

**完成日期 / Completion Date：2026-04-29
**开发者 / Developer**：喵谋运维运维团队 🐱⚙️
