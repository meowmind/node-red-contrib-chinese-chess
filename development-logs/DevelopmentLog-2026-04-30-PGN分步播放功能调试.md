# Development Log - 2026-04-30
## PGN 分步播放功能调试总结

---

### 一、问题反馈
- **用户问题**：通过 Node-RED 发送 `action: "load"` 消息加载 PGN 后，棋子不移动
- **根本原因**：
  1. `chineseMoveToCoordinate` 函数中，马、象、士走斜线的棋子，只计算了 `toX`，没有计算 `toY`
  2. `loadPGN` 函数加载后自动走完所有着法，导致分步播放失效

---

### 二、修复内容

#### 1. 斜线棋子终点坐标计算
**文件**：`resources/chinese-chess-core.js`
**位置**：`chineseMoveToCoordinate` 函数

**修改前**：
```javascript
// 马、象、士只有 toX，没有 toY
toX = ...;
// toY = null
```

**修改后**：
```javascript
// 根据棋子类型计算终点 Y 坐标
var dx = Math.abs(toX - fromX);
if (pieceType === PIECE.HORSE) {
    // 马走日：dx=1 则 dy=2，dx=2 则 dy=1
    var dy = (dx === 1) ? 2 : 1;
    toY = action === '进' ? 
        (isRedMove ? fromY - dy : fromY + dy) :
        (isRedMove ? fromY + dy : fromY - dy);
} else if (pieceType === PIECE.ELEPHANT) {
    // 象走田：dx=2，dy=2
    toY = action === '进' ? 
        (isRedMove ? fromY - 2 : fromY + 2) :
        (isRedMove ? fromY + 2 : fromY - 2);
} else if (pieceType === PIECE.ADVISOR) {
    // 士走斜线：dx=1，dy=1
    toY = action === '进' ? 
        (isRedMove ? fromY - 1 : fromY + 1) :
        (isRedMove ? fromY + 1 : fromY - 1);
}
```

---

#### 2. PGN 分步播放机制重构
**文件**：`resources/chinese-chess-core.js`

**Game 构造函数新增属性**：
```javascript
this.pgnMoves = null;        // PGN 棋谱着法缓存数组
this.pgnCurrentStep = 0;     // PGN 当前走到第几步
```

**loadPGN 函数修改**：
- 解析验证 PGN 后保存到 `pgnMoves` 数组
- 设置 `pgnCurrentStep = 0`
- **不自动执行任何走法**，保持棋盘在初始位置

**next 函数逻辑顺序（关键！）**：
1. 剧本分支模式（原有功能）
2. **回退后的前进**：重放已有历史（`currentMoveIndex < history.length`）
3. **PGN 新模式**：从 `pgnMoves` 数组取新步执行，`pgnCurrentStep++`

**back 函数同步逻辑**：
```javascript
// PGN 模式：同步更新 pgnCurrentStep
if (this.pgnMoves && this.pgnMoves.length > 0) {
    this.pgnCurrentStep = this.currentMoveIndex;
}
```

**reset 函数处理**：
- 不清除 `pgnMoves`（用户可以重新播放）
- 只重置 `pgnCurrentStep = 0`

---

#### 3. 其他代码修复
- `Game` 构造函数添加 `options = options || {}` 防止参数未定义
- `loadPGN` 中 `createGame()` → `new Game()` 修正调用方式
- `loadPGN` 中 `isValidMove` 调用参数修正

---

### 三、测试验证

#### 测试用例
```javascript
PGN: "1. 炮二平五 马8进7 2. 马二进三 车9平8"
```

#### 测试步骤与结果

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 加载 PGN | 棋盘保持初始位置，pgnMoves 缓存 4 步 | ✓ 正确 | ✅ |
| 2 | 点击 next 第 1 次 | 炮二平五 (7,7)→(4,7) | ✓ 正确 | ✅ |
| 3 | 点击 next 第 2 次 | 马8进7 (7,0)→(6,2) | ✓ 正确 | ✅ |
| 4 | 点击 next 第 3 次 | 马二进三 (7,9)→(6,7) | ✓ 正确 | ✅ |
| 5 | 点击 next 第 4 次 | 车9平8 (8,0)→(7,0) | ✓ 正确 | ✅ |
| 6 | 点击 back 第 1 次 | 回退到第 3 步 | ✓ 正确 | ✅ |
| 7 | 点击 back 第 2 次 | 回退到第 2 步 | ✓ 正确 | ✅ |
| 8 | 点击 next 第 5 次 | 重放历史，回到第 3 步 | ✓ 正确 | ✅ |

---

### 四、部署更新

#### Node-RED 集成
- **节点位置**：`/home/claw/nodered/app/node_modules/node-red-contrib-chinese-chess`
- **连接方式**：符号链接 → 源开发目录
- **重启方式**：`pkill -f node-red && systemctl start nodered`

#### 验证日志
```
[info] Server now running at http://127.0.0.1:1880/
[info] Starting flows
[info] Started flows
[info] [debug:debug 1] 
{
  payload: {
    fen: 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR w - - 0 1',
    currentStep: 0,
    totalSteps: 0,
    turn: 'red',
    history: []
  }
}
```

---

### 五、关键技术点总结

1. **双指针机制**：
   - `currentMoveIndex`：历史重放指针
   - `pgnCurrentStep`：PGN 播放指针
   - back 时必须同步两个指针

2. **执行优先级**：
   - 历史重放优先于 PGN 新步
   - 确保回退后再前进时，先走已有历史而不是执行新步

3. **开发模式最佳实践**：
   - `npm install file:` 创建符号链接
   - 修改源文件后只需重启 Node-RED
   - 无需反复 npm install

---

### 六、后续优化方向

1. 为兵卒过河后的横走添加更完善的测试用例
2. 考虑添加 goto 跳转到指定步数功能
3. 支持加载 PGN 后自动开始播放（可选配置）
4. 添加 PGN 加载进度显示

---

**文档创建时间**：2026-04-30 00:55  
**开发人员**：喵谋运维助手
