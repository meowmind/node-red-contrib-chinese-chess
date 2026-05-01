# node-red-contrib-chinese-chess Development Log / 开发日志

## 2026年4月25日 - Multi-Piece Same Column Notation Feature / 同列多棋子记谱功能开发

### Development Goals / 开发目标
Support Chinese notation for multiple pieces in the same column (e.g. "前车平七", "前炮二平五", etc.)
支持中国象棋同列多棋子的中文记谱法（如"前车平七"、"前炮二平五"等）

### Problem Analysis / 问题分析
1. **Input parsing issue**: Original code only supported standard notation (e.g. "炮二平五"), did not support "前" (front), "后" (back) prefix format
1. **输入解析问题**：原代码只支持标准记谱格式（如"炮二平五"），不支持"前"、"后"开头的方位词格式

2. **Output generation issue**: After making a move, piece has already moved, cannot correctly determine "front" or "back"
2. **输出生成问题**：走子后生成记谱时，棋子已经移动，无法正确判断"前"、"后"

3. **Edge case**: Should not add prefix when pieces are not in the same column
3. **边界情况**：棋子不在同列时不应该加前缀

### Solution Evolution / 解决方案演进

#### Version 1 (Input Parsing / 输入解析)
- Detect "前" (front), "后" (back) direction prefix
- Support 4-character format (前车平七)
- Support 5-character format (前炮二平五)

#### Version 2 (Output Fix - Post-move judgment / 输出修复 - 走子后判断)
- Traverse board to find same type pieces
- Issue: Piece already moved, need to "add piece back to start position"
- Issue: Complex judgment logic, error-prone

#### Version 3 (Final Solution - Pre-move judgment / 最终方案 - 走子前判断)
- **Core Idea**: Before `game.move()` executes, determine if the start column has multiple same-color, same-type pieces
- Traverse board before move, group by column
- If multiple pieces exist, determine "front" or "back", save to `move.positionPrefix`
- Use saved prefix directly when generating notation
- **Advantages**: Simple logic, accurate data, no edge cases

### Code Changes / 代码改动

#### 1. nodes/chinese-chess.js
- Frontend entry judgment logic: Support moves starting with "前" or "后"
- Original logic: Only check if first character is a piece name
- New logic: Support both standard format (piece name first) and direction prefix format (front/back + piece name first)

#### 2. resources/chinese-chess-core.js
**Game.prototype.move() Function:**
- Get piece information before move
- Traverse board for all same-type, same-color pieces
- Group by column, determine if start column has multiple pieces
- Determine "front" or "back" based on y-coordinate
- Save `positionPrefix` to moveObj

**coordinateToChineseMove() Function:**
- Simplified logic, directly use `move.positionPrefix`
- No longer need game parameter
- No longer need complex "add piece back" logic
- Keep column number when prefix exists (5-character format)

### Test Cases / 测试用例
| Scenario / 场景 | Expected Output / 预期输出 | Actual Output / 实际输出 |
|----------------|---------------------------|-------------------------|
| Two cannons in different columns / 两炮在不同列 | 炮二平五 | 炮二平五 ✓ |
| Two cannons same column, move top (Red) / 两炮在同列，走上面的炮（红方） | 前炮二平五 | 前炮二平五 ✓ |
| Two cannons same column, move bottom (Red) / 两炮在同列，走下面的炮（红方） | 后炮二平五 | 后炮二平五 ✓ |
| Two chariots same column, move bottom (Black, closer to Red) / 黑方双车同列，走下面的车（靠近红方） | 前车1平2 | 前车1平2 ✓ |
| Two chariots same column, move top (Black back rank) / 黑方双车同列，走上面的车（黑方底线） | 后车1平2 | 后车1平2 ✓ |

### Key Technical Points / 关键技术点
1. **Timing Selection**: Judgment must complete before move execution
1. **时机选择**：判断必须在走子前完成

2. **Direction Judgment**: For Red, smaller y = front; for Black, larger y = front (closer to opponent)
2. **方位判断**：红方y小=前，黑方y大=前（更靠近对方）

3. **Format Consistency**: Keep column number whenever prefix exists (5-character format)
3. **格式统一**：只要有前缀就保留列号（5字符格式）

4. **Backward Compatibility**: Older history without positionPrefix works correctly
4. **向后兼容**：旧版 history 没有 positionPrefix 也能正常工作

### Commit Records / 提交记录
- 3 related commits, final merge and simplified logic
- 3个相关提交，最终合并且简化逻辑

---

## Next Development Plan / 下一步开发计划

### Feature: WebSocket Interface / 待开发功能：WebSocket 接口
**Goal**: Receive external move commands and FEN positions via WebSocket
**目标**：通过 WebSocket 接收外部走子命令和 FEN 局面

#### Feature Requirements / 功能需求
1. **WebSocket Server**: Start WebSocket service within node library
1. **WebSocket Server**：在节点库内启动 WebSocket 服务

2. **Receive Move Payload**: Accept move commands (fromX, fromY, toX, toY or Chinese notation)
2. **接收 Move Payload**：接收走子命令（fromX, fromY, toX, toY 或中文记谱）

3. **Receive FEN Payload**: Accept FEN string and load to board
3. **接收 FEN Payload**：接收 FEN 字符串并加载到棋盘

4. **State Synchronization**: Sync board state to frontend after move
4. **状态同步**：走子后向前端同步棋盘状态
