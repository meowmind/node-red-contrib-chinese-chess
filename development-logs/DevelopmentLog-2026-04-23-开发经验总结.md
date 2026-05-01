# Node-RED Chinese Chess Node Development Experience Summary / Node-RED 中国象棋节点开发经验总结

**Date / 日期：** 2026-04-23
**Project / 项目：** node-red-contrib-chinese-chess
**Developer / 开发者：** 喵谋运维 🐱⚙️

---

## 1. FEN Format Handling / FEN 格式处理

### 1.1 FEN Loading Bug - Piece Overlay Issue / FEN 加载 Bug - 棋子叠加问题

**Problem / 问题：**
- `loadFEN()` first calls `this.reset()` to place initial pieces, then overlays FEN pieces on top, causing piece count to double
- Symptoms: 4 cannons, 4 horses, pieces disappearing, etc.

**Solution / 修复方案：**
```javascript
// Wrong approach / 错误做法：
this.reset(); // Place initial pieces first → then overlay FEN

// Correct approach / 正确做法：
// Reset board without placing initial pieces (completely clear)
this.board = new Board();
// Clear all board positions
for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
        this.board.squares[x][y] = null;
    }
}
this.history = [];
this.currentMoveIndex = 0;
this.recording = true;
```

### 1.2 FEN Validation / FEN 合法性校验

**Validation Items / 校验项：**
1. ✅ Must have exactly 10 rows
1. ✅ Each row width must be 9
1. ✅ Piece count limits (1 King, 2 Advisors, 2 Elephants, 2 Horses, 2 Chariots, 2 Cannons, 5 Pawns)
1. ✅ Kings must be within the palace
1. ✅ Illegal character validation

**Compatibility Mode / 兼容模式：**
- Auto-convert international chess notation: `N/n` → `马` (Horse), `B/b` → `象` (Elephant)
- Compatibility mode auto-recognizes and converts non-standard input

### 1.3 FEN Extraction Feature / FEN 提取功能

Extract valid FEN from any string (supports input with mixed text) by verifying each row width = 9.

---

## 2. Canvas Visual Optimization Experience / Canvas 视觉优化经验

### 2.1 Board Drawing / 棋盘绘制

**Wood Grain Effect / 木纹效果：** Use linear gradient + Bezier curve texture lines to simulate real wood grain
```javascript
var boardGradient = ctx.createLinearGradient(...);
boardGradient.addColorStop(0, '#e8c99e');
boardGradient.addColorStop(0.3, '#deb887');
boardGradient.addColorStop(0.5, '#d4a76a');
boardGradient.addColorStop(0.7, '#deb887');
boardGradient.addColorStop(1, '#e8c99e');
```

**Grid Line Color / 格线颜色：** Use brown `#8b4513` instead of black for more traditional board style

**Border Thickness Issue / 边框粗细问题：**
- ❌ Wrong: Using `roundRect()` + `stroke()` causes bottom border to thicken with grid lines
- ✅ Correct: Draw four borders separately, bottom with thin line (2px), others with thick lines (4px)

### 2.2 Traditional Board Markers / 传统棋盘标记

Four-corner triangle markers for cannon and pawn positions:
```javascript
// Helper function to draw markers
function drawMarker(x, y) {
    var cx = padding + x * cellSize + cellSize / 2;
    var cy = padding + y * cellSize + cellSize / 2;
    
    // Draw only half at edges to stay within board
    if (x > 0) { /* Draw left two triangles */ }
    if (x < 8) { /* Draw right two triangles */ }
}
```

**Marker Positions / 标记位置：**
- Black Pawn positions: (0,3)(2,3)(4,3)(6,3)(8,3)
- Black Cannon positions: (1,2)(7,2)
- Red Pawn positions: (0,6)(2,6)(4,6)(6,6)(8,6)
- Red Cannon positions: (1,7)(7,7)

### 2.3 Piece Visual Optimization / 棋子视觉优化

**Piece Text / 棋子文字：**
- Font: KaiTi `KaiTi, STKaiti, serif` for better calligraphy feel
- Distinction: Red uses traditional with radical (傌, 俥), Black uses pure traditional (馬, 車), Black cannon uses stone radical 砲

**Realistic Texture / 真实质感：**
- Multi-layer radial gradients (highlight, bright, dark, shadow)
- Drop shadow for depth
- White inner circle decorative border
- Text shadow for readability

### 2.4 Selection Effect / 选中效果

**Enlarge** instead of color highlighting for more natural effect when piece is selected:
```javascript
var isSelected = this.selected && this.selected.x === x && this.selected.y === y;
var pieceRadius = isSelected ? cellSize * 0.45 : cellSize * 0.40;
```

---

## 3. Animation Implementation Experience / 动画实现经验

### 3.1 Move Animation Architecture / 移动动画架构

**State Management / 状态管理：**
```javascript
this.animating = {
    piece: piece,        // Currently moving piece / 正在移动的棋子
    fromX: fromX, fromY: fromY,  // Start position / 起始位置
    toX: toX, toY: toY,          // Target position / 目标位置
    progress: 0,         // Animation progress 0→1 / 动画进度
    startTime: Date.now()
};
```

**Animation Loop / 动画循环：** Use `requestAnimationFrame` (60fps)
```javascript
Renderer.prototype.startAnimationLoop = function() {
    var self = this;
    function animate() {
        if (self.animating) {
            // Update progress
            var now = Date.now();
            var elapsed = now - self.animating.startTime;
            var duration = 200;
            self.animating.progress = Math.min(elapsed / duration, 1);
            
            if (self.animating.progress >= 1) {
                self.animating = null;
            }
            self.render();
        }
        self.animationId = requestAnimationFrame(animate);
    }
    this.animationId = requestAnimationFrame(animate);
};
```

### 3.2 Easing Functions / 缓动函数

Use **easeOutQuad** for natural deceleration:
```javascript
var t = anim.progress;
var easeProgress = t * (2 - t); // Deceleration effect

var currentX = fromX + (toX - fromX) * easeProgress;
var currentY = fromY + (toY - fromY) * easeProgress;
```

**Common Easing Function Reference / 常用缓动函数参考：**
| Name / 名称 | Formula / 公式 | Effect / 效果 |
|-------------|----------------|---------------|
| Linear | `t` | Constant speed / 匀速 |
| easeOutQuad | `t*(2-t)` | Deceleration (recommended for movement) / 减速（推荐用于移动） |
| easeOutCubic | `(t-1)^3+1` | More pronounced deceleration / 更明显减速 |
| easeOutBack | `...` | Bounce effect / 回弹效果 |

### 3.3 Animation Drawing Order / 动画绘制顺序

1. ✅ Draw board background, grid lines first
1. ✅ Draw movement trajectory dashed line (`ctx.setLineDash([5,5])`)
1. ✅ Draw stationary pieces (skip original position for animating piece)
1. ✅ Draw animating piece separately at interpolated position

### 3.4 Animation Trigger Timing / 动画触发时机

**Correct Sequence / 正确顺序：**
1. First execute `game.move()` to update board state
2. Then call `triggerMoveAnimation()` with pre-move piece reference
3. Don't draw target position piece during animation, only draw at interpolated position

**Wrong Approach / 错误做法：** Draw animation first then execute move → state desynchronization

---

## 4. Frontend Interaction Experience / 前端交互经验

### 4.1 FEN Detection Logic / FEN 检测逻辑

**Wrong / 错误：** Rely on space to detect FEN
```javascript
if (typeof msg.payload === "string" && msg.payload.indexOf(" ") > 0)
```

**Correct / 正确：** Use `/` detection (pure FEN also contains row separators)
```javascript
if (typeof msg.payload === "string" && msg.payload.indexOf("/") >= 0)
```

### 4.2 Frontend Output / 前端输出

Output complete state via `move` event after FEN import success, consistent with normal moves:
```javascript
this.triggerEvent('move', {
    fen: this.getFEN(),
    history: this.history,
    currentStep: this.history.length,
    totalSteps: this.history.length,
    turn: this.currentMoveIndex % 2 === 0 ? 'red' : 'black'
});
```

---

## 5. Debugging Techniques / 调试技巧

### 5.1 Browser Console / 浏览器 Console

Add `console.log` output at key points:
- FEN validation errors
- Piece counts before/after loading
- Animation progress changes

### 5.2 Incremental Validation / 增量验证

Verify immediately after each change:
1. Piece counts after FEN load (2 cannons, 2 horses)
2. Move animation smoothness
3. Undo/Redo functionality working
4. Page refresh state persistence

---

## 6. Summary of Experience / 经验总结

| Category / 类别 | Lessons Learned / 经验 |
|-----------------|-----------------------|
| ⚠️ **Bug Lessons / Bug 教训** | 1. `reset()` places initial pieces, must clear before loading FEN<br>2. Canvas `stroke()` accumulates, watch thickness on adjacent lines<br>3. String detection shouldn't rely on optional characters (like FEN space) |
| ✅ **Best Practices / 最佳实践** | 1. Use `requestAnimationFrame` not `setInterval` for Canvas animation<br>2. Always use easing functions for animation, avoid constant speed<br>3. Use natural effects like scale up/down rather than color highlighting |
| 🎯 **Product Thinking / 产品思维** | 1. Support compatibility mode, don't easily reject user input<br>2. Xiangqi is traditional culture, visuals should match traditional style<br>3. 200ms animation duration is comfortable for user experience |
| 📐 **Design Principles / 设计原则** | 1. Edge elements shouldn't be drawn outside container<br>2. Decorative elements need boundary judgment<br>3. Keep output format consistent for similar operations |

---

## 7. Future Optimization Directions / 后续优化方向

- [ ] Piece move highlighting (mark valid positions)
- [ ] Check (general) flashing warning animation
- [ ] Piece capture animation effects
- [ ] More notation markers (comment arrows)
- [ ] Responsive board scaling support

---

*Recorded 2026-04-23, MeowMind Operations Knowledge Base / 记录于 2026-04-23，喵谋运维知识库*
