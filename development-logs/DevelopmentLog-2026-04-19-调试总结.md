# node-red-contrib-chinese-chess Development & Debugging Experience Summary / node-red-contrib-chinese-chess 开发调试经验总结

## Project Background / 项目背景
Develop Chinese Xiangqi Node-RED Dashboard node, compatible with Node-RED Dashboard v1, solving node display issues.
开发中国象棋 Node-RED Dashboard 节点，适配 Node-RED Dashboard v1，解决节点无法显示问题。

## Troubleshooting Process & Solutions / 问题排查过程与解决方案

### Issue 1: Backend module loading error `ChineseChess is not defined` / 问题 1：后端模块加载错误 `ChineseChess is not defined`
**Error Symptom / 错误现象**
```
ReferenceError: ChineseChess is not defined
```
**Cause / 原因**
Frontend code written directly in backend JS file, Node.js parses variables early, but `window`/`ChineseChess` don't exist on backend.

**Solution / 解决方案**
1. **Never write frontend code directly in backend scope**, must pass code string to frontend controller via `new Function()`
2. All references to `ChineseChess` must be written as `window["ChineseChess"]` to prevent early backend parsing access

---

### Issue 2: Array multi-line concatenation causing syntax error `Unexpected token ')'` / 问题 2：数组拼接多行代码导致语法错误 `Unexpected token ')'`
**Error Symptom / 错误现象**
```
SyntaxError: Unexpected token ')'
    at new Function (<anonymous>)
```
**Cause / 原因**
Each line as array element, each line ends with comma, last parameter also has comma → syntax error in some JavaScript environments.

**Bad Example / 错误示例**
```javascript
[
    'game.move(',
    '    parseInt(data.from[0], 10),',
    '    parseInt(data.from[1], 10),',
    ');',  // <- Extra comma causes syntax error
]
```

**Solution / 解决方案**
1. Merge closing bracket `);` into last parameter line
2. Use `.join('\n')` for one-time concatenation, don't add line by line
3. Pass to `new Function()` after concatenation complete

**Correct Approach / 正确写法**
```javascript
[
    'game.move(',
    '    parseInt(data.from[0], 10),',
    '    parseInt(data.from[1], 10),',
    '    parseInt(data.to[0], 10),',
    '    parseInt(data.to[1], 10));'
].join('\n');
```

---

### Issue 3: Static resource 404 Not Found / 问题 3：静态资源 404 Not Found
**Error Symptom / 错误现象**
```
GET http://127.0.0.1:1880/ui/resources/node-red-contrib-chinese-chess/chinese-chess-core.js 404
```
**Cause / 原因**
Using relative path `resources/...`, incorrectly concatenated to `/ui/resources/...` under Dashboard route `/ui/`.

**Solution / 解决方案**
Change to **absolute path**, start with `/`:
```javascript
script.src = "/resources/node-red-contrib-chinese-chess/chinese-chess-core.js";
```

Must also declare static resource directory in `package.json`:
```json
"node-red": {
  "static": ["resources"]
}
```

---

### Issue 4: DOM element not found, board won't render / 问题 4：DOM 找不到元素，棋盘无法渲染
**Error Symptom / 错误现象**
No obvious console error, but board just doesn't display, `document.getElementById()` returns `null`.

**Cause / 原因**
1. Node-RED Dashboard uses AngularJS dynamic DOM rendering, DOM not yet inserted when executing synchronously in initController
2. Fixed ID causes conflicts in multi-instance scenarios

**Solution / 解决方案**
1. Use AngularJS `$scope.$evalAsync()` callback to ensure DOM insertion complete
2. Use `$scope.$id` to generate **unique ID** to avoid multi-instance conflicts
3. Add short `setTimeout(init, 50)` as fallback

```javascript
// Dynamic ID in template
'<div data-ng-attr-id="{{containerId}}"></div>'

// Dynamic generation in controller
$scope.containerId = "chess-container-" + $scope.$id;
$scope.$evalAsync(function() {
    setTimeout(init, 50);
});
```

---

### Issue 5: node-red-dashboard module not found / 问题 5：node-red-dashboard 模块找不到
**Error Symptom / 错误现象**
```
Error: Cannot find module 'node-red-dashboard'
```
**Cause / 原因**
Node-RED installation directory not default `~/.node-red`, direct `require()` cannot find it.

**Solution / 解决方案**
Must use Node-RED provided `RED.require()` method:
```javascript
var ui = RED.require("node-red-dashboard")(RED);
```
Cannot directly write `require("node-red-dashboard")`.

---

### Issue 6: Dashboard v1 missing required configuration items / 问题 6：Dashboard v1 缺少必填配置项
**Error Symptom / 错误现象**
Node doesn't display after adding to Dashboard, edit interface incomplete configuration.

**Solution / 解决方案**
Must include these configuration items in `.html` file:
```html
<div class="form-row">
  <label for="node-input-group"><i class="fa fa-group"></i> Group</label>
  <input type="text" id="node-input-group">
</div>
<div class="form-row">
  <label for="node-input-width">Width</label>
  <input type="number" id="node-input-width" placeholder="15">
</div>
<div class="form-row">
  <label for="node-input-height">Height</label>
  <input type="number" id="node-input-height" placeholder="15">
</div>
<div class="form-row">
  <label for="node-input-order">Order</label>
  <input type="number" id="node-input-order" placeholder="0">
</div>
```
Missing `group`/`width`/`height`/`order` causes node not to display correctly in v1.

---

## Lessons Learned Summary / 经验教训总结

| No. / 序号 | Lesson Learned / 经验教训 |
|-----------|--------------------------|
| 1 | Frontend and backend code must be separated, frontend code concatenated as string, passed to controller via `new Function()`, cannot write directly in backend |
| 2 | Node-RED Dashboard v1 development must use `RED.require("node-red-dashboard")` not direct `require` |
| 3 | Static resource paths must use **absolute path** `/resources/...`, relative paths cause 404 under Dashboard route |
| 4 | Must add `"static": ["resources"]` declaration in `package.json` "node-red" section for static resource directory |
| 5 | DOM lookup must wait for AngularJS rendering complete, use `$scope.$evalAsync()` + `setTimeout` fallback |
| 6 | Must use dynamic unique ID for multi-instance scenarios, generated based on `$scope.$id` to avoid conflicts |
| 7 | Multi-line array concatenation code must not have trailing comma on last element, otherwise syntax parsing error |
| 8 | Dashboard v1 node configuration must include `group`/`width`/`height`/`order` |
| 9 | References to variables on window object must be written as `window["VarName"]` to avoid early backend parsing |

---

## Node-RED Dashboard v1 Node Development Standard Template / Node-RED Dashboard v1 节点开发标准模板

```javascript
module.exports = function(RED) {
    var ui = undefined;

    function MyNode(config) {
        RED.nodes.createNode(this, config);
        if (ui === undefined) {
            ui = RED.require("node-red-dashboard")(RED);
        }

        var htmlTemplate = '<div id="{{containerId}}"></div>';

        var initCode = [
            '$scope.containerId = "mycontainer-" + $scope.$id;',
            'function init() { /* initialization code */ }',
            '$scope.$evalAsync(function() { setTimeout(init, 50); });'
        ].join('\n');

        var initController = new Function('$scope', 'events', initCode);

        var done = ui.addWidget({
            node: this,
            format: htmlTemplate,
            templateScope: "local",
            group: config.group,
            order: config.order,
            width: config.width,
            height: config.height,
            initController: initController,
            // ... other configurations
        });

        this.on("close", done);
    }
    RED.nodes.registerType("my-node-type", MyNode);
};
```

---

## Debugging Tools / 调试工具

1. Backend logs / 后端日志：`journalctl -u nodered -n 100 -f`
2. Frontend debugging / 前端调试：Browser `F12` → Console tab for errors
3. Static resource verification / 静态资源验证：`curl -I http://127.0.0.1:1880/resources/xxx/xxx.js` confirm returns 200

---

## Board Style Alignment Issues / 棋盘样式对齐问题
### Issue 1: Duplicate vertical line drawing causing lines across river boundary / 问题 1：重复绘制竖线导致始终有竖线穿过楚河汉界
**Symptom / 错误现象**：
Users kept reporting "still vertical lines crossing river boundary", multiple disconnect position modifications didn't help.

**Cause / 原因**：
Code first drew one complete connected set of all vertical lines, then drew a second disconnected version → first complete drawing always existed, so river boundary always had lines.

**Solution / 解决方案**：
Delete first complete drawing, only keep two-segment disconnected version, ensure complete whitespace in middle.

---

### Issue 2: River boundary vertical line disconnect position wrong / 问题 2：楚河汉界竖线断开位置错误
**Symptom / 错误现象**：
Disconnect position wrong, still occupied cell space, affecting piece placement.

**Correct Position Analysis / 正确位置分析**：
- Chinese chess board 9x10 grid, y=0~9
- Black pawn at y=3, Red pawn at y=5
- River boundary should be between pawn rows → **exactly between y=4 line and y=5 line**
- Entire gap height exactly 1 cell, doesn't occupy piece cell space

**Correction / 错误修正**：
❌ Wrong: Disconnect at y=4.5~5.5 → invades cell
✅ Correct: Disconnect at y=4 line ~ y=5 line → exactly between pieces

---

### Issue 3: Left/right outer borders also disconnected / 问题 3：左右外侧边线也被断开了
**Requirement / 正确要求**：Leftmost and rightmost borders should remain fully connected, not disconnected. Only middle vertical lines need river boundary break.

**Solution / 解决方案**：
```javascript
if (i === 0 || i === 8) {
  // Leftmost/rightmost borders: fully connected, no disconnect
  ctx.beginPath();
  ctx.moveTo(x, padding + cellSize / 2);
  ctx.lineTo(x, padding + 9.5 * cellSize);
  ctx.stroke();
} else {
  // Middle vertical lines: disconnected at river boundary
  // Draw top segment + bottom segment
}
```

---

### Issue 4: Coordinate numbering type and order / 问题 4：坐标编号数字类型和顺序
**Final Alignment Requirement / 最终对齐参考网站要求**：
- **Black (Top)**: Arabic numerals 1~9, Left → Right
- **Red (Bottom)**: Chinese numerals 一~九, Right → Left

**Correct Code / 正确代码**：
```javascript
var chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
var arabicNums = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

for (var i = 0; i < 9; i++) {
  // Black (top): Arabic numerals Left→Right 1-9
  ctx.fillText(arabicNums[i], x, padding * 0.6);
  // Red (bottom): Chinese numerals Right→Left 一-九
  ctx.fillText(chineseNums[8 - i], x, padding + cellSize * 10 + padding * 0.6);
}
```

---

### Issue 5: River boundary text vertical centering / 问题 5：楚河汉界文字上下居中
**Correct Method / 正确方法**：
Calculate center point precisely:
```javascript
var riverTopY = padding + 4 * cellSize + cellSize / 2;    // River top edge (line position)
var riverBottomY = padding + 5 * cellSize + cellSize / 2; // River bottom edge (line position)
var riverCenterY = (riverTopY + riverBottomY) / 2; // Exact center point
ctx.fillText('楚 河', padding + 2.25 * cellSize, riverCenterY + cellSize/8);
ctx.fillText('漢 界', padding + 6.75 * cellSize, riverCenterY + cellSize/8);
```

---

## Style Alignment Experience Summary / 样式对齐经验总结

| No. / 序号 | Lesson Learned / 经验教训 |
|-----------|--------------------------|
| 10 | Be careful not to duplicate-draw grid lines, duplicated drawing causes modifications not to apply, problem seems persistent |
| 11 | River boundary should be placed between piece rows, not occupy piece cell space, correct position is between y=4 line ~ y=5 line |
| 12 | Left/right outer borders must remain connected, only middle vertical lines need river boundary break |
| 13 | Traditional Chinese chess coordinate numbering convention: Black (top) Arabic numerals, Red (bottom) Chinese numerals |
| 14 | Text centering must precisely calculate vertical edge center points, don't rely on guesswork offsets |
| 15 | Must copy file to correct Node-RED node_modules directory and restart service after each modification, otherwise changes won't take effect |

---

## Move Function & Rule Validation Issue Summary / 走子功能与规则验证问题总结

### Issue 1: Wrong piece initial positions / 问题 1：棋子初始位置错误
**Symptom / 错误现象**：Horse and Elephant positions wrong, not on back rank, Red cannon and pawn positions shifted down one row.

**Correct Initial Layout (Standard Xiangqi) / 正确初始布局（标准中国象棋）**：
```
y=0 → Black back rank: King, Advisor, Elephant, Horse, Chariot
_y=1 → Empty
y=2 → Black cannons
y=3 → Black pawns
_y=4 → Empty (river boundary top edge)
_y=5 → Empty (river boundary bottom edge)
y=6 → Red pawns
y=7 → Red cannons
_y=8 → Empty
y=9 → Red back rank: King, Advisor, Elephant, Horse, Chariot
```
**Perfectly symmetrical**, after correction matches standard layout.

---

### Issue 2: Pieces disappearing after move / 问题 2：棋子走子消失问题
**Symptom / 错误现象**：Selected piece disappears after moving to target position.

**Root Cause Analysis / 原因分析**：
- `Board.prototype.move` clears start cell first, then gets piece → if start cell empty, already cleared but nothing placed, piece just gone
- Missing target coordinate bounds checking, user clicking outside board causes piece to move out

**Multi-layer Protection Solution / 多层防护解决方案**：
1. Check at beginning of `move`: start cell must have piece, otherwise return `null` without execution
2. Check target coordinates must be within board bounds, otherwise don't execute
3. Correct `captured` logic: first get piece at target position, then place new piece, correct logical order

```javascript
// Correct order / 正确顺序
var piece = this.grid[fromY][fromX];
if (!piece) return null; // Early protection

var captured = this.grid[toY][toX]; // First get captured piece
this.grid[fromY][fromX] = null;     // Then clear start
this.grid[toY][toX] = piece;        // Finally place at end
```

---

### Issue 3: Added complete Xiangqi move rule validation / 问题 3：添加完整中国象棋走法规则验证

## Complete Xiangqi Move Rule Validation Checklist / 中国象棋完整走子规则校验清单
| Piece / 棋子 | Rule Description / 规则说明 | Implemented / 是否完成 |
|-------------|----------------------------|---------------------|
| King / 将/帅 | Palace bounds, one step per move, Kings cannot face each other directly | ✅ |
| Advisor / 士/仕 | Palace bounds, one step diagonal only | ✅ |
| Elephant / 象/相 | Cannot cross river, field shape move, elephant eye blocking detection | ✅ |
| Horse / 马 | Day shape move, horse leg blocking detection | ✅ |
| Chariot / 车 | Straight line movement, cannot pass through blocking pieces | ✅ |
| Cannon / 炮 | Straight line movement, no blocking when not capturing, must jump one piece to capture | ✅ |
| Pawn / 卒/兵 | Can only advance before river, can move sideways after crossing, cannot move backward | ✅ |
| General Rule / 通用规则 | Cannot capture own color piece | ✅ |

---

## State Persistence & Previous/Next Move Issue Summary / 状态持久化与上一步下一步问题总结

### Issue 1: Board resets to initial position after page refresh / 问题 1：刷新页面后棋盘重置为初始局面
**Cause / 原因**：
Frontend initialization didn't read FEN passed from backend, always reset to initial state.

**Solution / 解决方案**：
1. Add `loadFEN(fen)` method to core `Game` prototype, load position from standard FEN string
2. Add `getFEN()` method, export current position standard FEN
3. Frontend controller supports receiving input FEN and loading:
   - `action: load` with `fen` → load
   - Direct payload as FEN string → auto-detect load
4. User configures in Flow:
   - Input: `Set msg.payload = flow.chessFen` → retrieve saved FEN
   - Output: `Set flow.chessFen = msg.payload.fen` → save latest FEN

---

### Issue 2: Board clears/resets after clicking Previous/Next / 问题 2：上一步下一步点击后棋盘清空重置
**Root Cause: Variable order error / 根本原因：变量顺序错误**
```javascript
// Wrong approach / 错误写法
this.currentMoveIndex--;     // Modify index → 5→4
this.reset();                // reset() resets currentMoveIndex to 0!
for (i=0; i<this.currentMoveIndex; i++) → Loop 0 times, board empty!
```

**Correct Fix / 正确修复**：
```javascript
var targetIndex = this.currentMoveIndex; // Save target first
this.reset();
this.currentMoveIndex = targetIndex;     // Restore after reset
for (i=0; i<this.currentMoveIndex; i++) { ... } // Executes correctly
```

Fixed same issue in all three methods: `back()` / `next()` / `goto()`

---

### Issue 3: Cannot advance after undo / 问题 3：回退后无法前进
**Cause / 原因**：Original code used `splice` to delete history, after undo history was deleted, next step couldn't find moves.

**Solution / 解决方案**：
- Don't delete history, only adjust `currentMoveIndex` pointer
- Undo only moves pointer forward, advance moves pointer back
- Support infinite back/forth viewing without losing any steps

---

### Issue 4: Output FEN not updated after undo/advance / 问题 4：回退/前进后不更新输出 FEN
**Cause / 原因**：Only triggered `back/next/goto` events, didn't trigger `move` event, Node-RED couldn't receive latest FEN.

**Solution / 解决方案**：
Any board-modifying operation triggers `move` event → frontend outputs latest FEN → Flow variable auto-updates:
- `back()` → `triggerEvent('move')`
- `next()` → `triggerEvent('move')`  
- `goto()` → `triggerEvent('move')`

---

## Functionality Issue Experience Summary / 功能问题经验总结

| No. / 序号 | Lesson Learned / 经验教训 |
|-----------|--------------------------|
| 16 | Piece disappearance issues need multi-layer protection: start check + target check + correct placement order |
| 17 | Complete Xiangqi rules must all be implemented, otherwise users can make illegal moves |
| 18 | Undo/advance shouldn't delete history, only move pointer → supports back/forth viewing, no step loss |
| 19 | Must trigger event output latest state after board changes, ensure Node-RED always saves latest FEN |
| 20 | Variable order matters: state-dependent modifications must watch out for function calls that reset variables |
| 21 | State persistence relies on Node-RED flow variable saving, node itself only responsible for loading input FEN, storage handled by Flow configuration |

---

**Final Completion Date / 最终完成日期**：2026-04-19
**Fix Result / 修复结果**：✅ All functionality issues fixed, complete move rules correct, Previous/Next working normally, board position preserved after page refresh
**Project Status / 项目状态**：Fully usable, feature complete
