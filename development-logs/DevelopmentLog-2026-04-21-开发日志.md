# Node-RED Chinese Chess Node Development Log / Node-RED 中国象棋节点开发日志

## Date / 日期：2026年4月21日

---

## 1. Issue List & Fix Records / 问题清单与修复记录

### ✅ Issue 1: Pawn river crossing boundary error / 问题 1：兵的过河判断边界错误
**Discovered / 发现时间：** 2026-04-21 Afternoon / 下午
**Description / 问题描述：**
- Pawn cannot move horizontally after reaching the river, needs one more step forward
- Red `fromY > 4` judgment error caused y=5 to be counted as "not crossed river"
- Black `fromY < 5` judgment error caused y=4 to be counted as "not crossed river"

**Solution / 修复方案：**
```javascript
// Before fix / 修复前
if (fromY > 4) { /* Red not crossed river */ }
if (fromY < 5) { /* Black not crossed river */ }

// After fix / 修复后
if (fromY > 5) { /* Red not crossed river (y=6,7,8,9) */ }
if (fromY < 4) { /* Black not crossed river (y=0,1,2,3) */ }
```

**Fixed File / 修复文件：** `resources/chinese-chess-core.js` (line 190-209)

---

### ✅ Issue 2: Missing Chinese notation input interface / 问题 2：中文记谱输入接口缺失
**Discovered / 发现时间：** 2026-04-21 Afternoon / 下午
**Description / 问题描述：**
- Cannot control moves via inject node with Chinese notation (e.g. "炮二平五")
- Only manual board clicks were supported

**Solution / 修复方案：**
1. Fixed message receiving mechanism: Changed from `events.on("msg")` to `$scope.$watch("msg")`
2. Handled Chinese notation in switch's default branch
3. Added piece type recognition and coordinate conversion

**Input Format / 输入格式：**
```javascript
{"action": "炮二平五"}   // Red uses Chinese numerals 一~九
{"action": "马8进7"}    // Black uses Arabic numerals 1~9
```

**Fixed File / 修复文件：** `nodes/chinese-chess.js`

---

### ✅ Issue 3: Wrong Chinese notation coordinate direction / 问题 3：中文记谱坐标方向错误
**Discovered / 发现时间：** 2026-04-21 23:35
**Description / 问题描述：**
- Sending "炮二平五" actually moved cannon from column 8 to 5
- Red coordinates are counted from right to left, code incorrectly counted left to right

**Solution / 修复方案：**
```javascript
// Before fix / 修复前
fromX = chineseNum[fromNumStr];

// After fix / 修复后
fromX = 8 - chineseNum[fromNumStr];  // Red counts from right
```

**Affected Pieces / 涉及棋子：** Start coordinates, end coordinates (horizontal), column-type pieces (Horse, Elephant, Advisor)

**Fixed File / 修复文件：** `resources/chinese-chess-core.js` (chineseMoveToCoordinate function)

---

### ✅ Issue 4: Double forwarding causing duplicate output / 问题 4：双重转发导致重复输出
**Discovered / 发现时间：** 2026-04-21 23:45
**Description / 问题描述：**
- One inject input produced two identical output messages
- Both `forwardInputMessages: true` and `node.send(msg)` were set

**Solution / 修复方案：**
```javascript
// Before fix / 修复前
forwardInputMessages: true,
node.on('input', function(msg, send, done) {
    node.send(msg);  // Duplicate forwarding
});

// After fix / 修复后
forwardInputMessages: false,
node.on('input', function(msg, send, done) {
    // No auto-forward, output controlled by frontend
});
```

**Fixed File / 修复文件：** `nodes/chinese-chess.js`

---

### ✅ Issue 5: No alert output for invalid moves / 问题 5：非法走法不输出报警
**Discovered / 发现时间：** 2026-04-21 23:45
**Description / 问题描述：**
- Invalid moves (no piece at start, rule violation) didn't move piece but also output no message
- Silent failure made error capture impossible in flow

**Solution / 修复方案：**
```javascript
// No piece at start / 起点无棋子
$scope.send({
    payload: {
        error: "Invalid move / 非法走法",
        message: moveText + " (No piece at start position / 起点无对应棋子)",
        success: false
    }
});

// Rule violation / 不符合规则
$scope.send({
    payload: {
        error: "Invalid move / 非法走法",
        message: moveText + " (Violates move rules / 不符合规则)",
        success: false
    }
});

// Cannot parse / 无法解析
$scope.send({
    payload: {
        error: "Cannot parse move / 无法解析走法",
        message: moveText,
        success: false
    }
});
```

**Info Panel Sync with Emoji Hints / 信息面板同步添加 emoji 提示：**
- ✅ Move executed successfully
- ⚠️ Invalid move
- ❌ Cannot parse move

**Fixed File / 修复文件：** `nodes/chinese-chess.js`

---

### ✅ Issue 6: Chinese notation bypassing turn check / 问题 6：中文记谱绕过轮次检查
**Discovered / 发现时间：** 2026-04-22 00:05
**Description / 问题描述：**
- Mouse click selection has color filtering (cannot select Black when it's Red's turn)
- But Chinese notation interface bypassed this check, could send "炮2平5" (Black) as first move

**Solution / 修复方案：**
```javascript
// Add turn check at beginning of chineseMoveToCoordinate function
var expectedIsRed = (game.currentMoveIndex % 2 === 0);
if (isRedMove !== expectedIsRed) {
    console.log("[chinese-chess] Wrong turn, expecting " + (expectedIsRed ? "Red" : "Black") + " to move");
    return null;
}
```

**Fixed File / 修复文件：** `resources/chinese-chess-core.js`

---

### ✅ Issue 7: Wrong turn judgment after undo / 问题 7：回退后轮次判断错误
**Discovered / 发现时间：** 2026-04-22 00:18
**Description / 问题描述：**
- Red moves → Black moves → Click "Previous" to undo Black's move
- Should now be Black's turn, but display showed Red's turn
- Cause: All locations used `history.length` for turn judgment, but undo doesn't change history length, only `currentMoveIndex` decreases

**Solution / 修复方案：**
Unified all turn judgment from `history.length` to `currentMoveIndex`

| Location / 位置 | Purpose / 用途 |
|-----------------|---------------|
| `chineseMoveToCoordinate` | Chinese notation turn check |
| `getCurrentTurn` | Mouse click selection permission |
| Output `msg.turn` field | Tell Node-RED whose turn it is |
| Info panel text | UI display "Turn: Red/Black" |

**4 code locations fixed / 共修复 4 处代码**

---

## 2. Interface Specification / 接口规范

### Input Format / 输入格式
```javascript
// Chinese notation move / 中文记谱走棋
{"action": "炮二平五"}   // Red: Chinese numerals 一~九
{"action": "马8进7"}    // Black: Arabic numerals 1~9

// Other actions / 其他动作
{"action": "reset"}           // Reset board
{"action": "prev"}            // Previous move
{"action": "next"}            // Next move
{"action": "goto", "step": 0} // Jump to specified step
{"action": "loadfen", "fen": "..."} // Load FEN position
```

### Output Format / 输出格式
**Move Success / 走法成功：**
```javascript
{
    payload: {
        fen: "...",          // Current position FEN
        pgn: "...",          // PGN notation text
        pgnArray: [...],     // Moves array
        currentStep: 2,      // Current step number
        totalSteps: 2,       // Total steps
        turn: "red",         // Whose turn red/black
        history: [...]       // Complete move history
    }
}
```

**Move Failure / 走法失败：**
```javascript
{
    payload: {
        error: "Invalid move / 非法走法",   // Or "Cannot parse move / 无法解析走法"
        message: "...",                     // Detailed reason
        success: false
    }
}
```

---

## 3. Test Checklist / 测试清单
- [x] 炮二平五 (Red first move, correct coordinate conversion)
- [x] 炮2平5 (Black first move, wrong turn intercepted)
- [x] 兵三进一 (Pawn moves forward one step)
- [x] 兵三平四 (Pawn moves horizontally after crossing river)
- [x] 马二进三 (Horse moves in L-shape)
- [x] 车一平二 (Chariot moves horizontally)
- [x] Invalid move does nothing + outputs alert
- [x] Turn display correct after undo
- [x] Mouse click only selects pieces of current turn color

---

## 4. Next Steps / 下一步计划
1. Improve coordinate calculation for `advance/retreat` moves (especially for Horse, Elephant, Advisor end coordinates)
2. Add more opening test cases
3. Support multiple same-type pieces in same column (e.g. "前车平七")
4. Optimize UI response speed
