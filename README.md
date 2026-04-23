# Node-RED Chinese Chess (Xiangqi) | 中国象棋节点

---

## 📖 English Documentation

### Overview

A custom Node-RED node that provides an **interactive Chinese Chess (Xiangqi)** board with dynamic PGN support. Perfect for chess tutorials, opening analysis, and multi-branch scripted gameplay.

### Features

- ✅ **Interactive Canvas Board** - Native HTML5 Canvas rendering, no external dependencies
- ✅ **Standard PGN Format Support** - Load and replay chess games in PGN notation
- ✅ **Step-by-step Replay** - Forward/backward navigation through moves
- ✅ **User Interactive Play** - Click to move pieces with full rule validation
- ✅ **Multi-branch Scripts** - Support for tutorial scripts with multiple response options
- ✅ **Node-RED Dashboard Integration** - Seamless embedding in Dashboard flows
- ✅ **FEN Output** - Export current board state as FEN string
- ✅ **Chinese Notation Support** - Native support for traditional Chinese move notation

### Installation

#### Via Node-RED Palette Manager

1. Open Node-RED
2. Go to Menu → Manage Palette → Install
3. Search for `node-red-contrib-chinese-chess`
4. Click Install

#### Manual Installation

```bash
cd ~/.node-red
npm install node-red-contrib-chinese-chess
```

Restart Node-RED after installation.

### Usage

#### 1. Basic Setup

1. Drag the `chinese-chess` node from the palette to your flow
2. Configure the node:
   - **Group**: Dashboard group to place the board in
   - **Size**: Width/Height of the widget
   - **Board Size**: Pixel size of the chess board
   - **Orientation**: Red at bottom / Black at bottom (default: Red)

#### 2. Input Control

Send messages to control the board:

```javascript
// Load PGN game
{ payload: { action: "load", pgn: "1. 炮二平五 马8进7 2. 马二进三 车9平8" } }

// Load FEN position
{ payload: { action: "loadfen", fen: "3k5/4a4/4c4/9/9/9/9/4C4/4A4/3K5 w - - 0 1" } }

// Navigation
{ payload: { action: "next" } }      // Next move
{ payload: { action: "prev" } }      // Previous move  
{ payload: { action: "goto", step: 5 } }  // Jump to move #5
{ payload: { action: "reset" } }     // Reset to starting position

// Execute move (coordinate format)
{ payload: { action: "move", from: [1, 7], to: [4, 7] } }
```

#### 3. Output Format

The node outputs current state after each valid move:

```javascript
{
    payload: {
        fen: "3k5/4a4/4c4/9/9/9/9/4C4/4A4/3K5 w - - 0 1",
        pgn: "1. 炮二平五",
        pgnArray: ["炮二平五"],
        currentStep: 1,
        totalSteps: 1,
        turn: "red",
        history: [...]
    }
}
```

### Chess Piece Reference

| Piece Type | Black (Top) | Red (Bottom) | English Name |
|------------|-------------|--------------|--------------|
| King       | 将          | 帅           | King / General |
| Advisor    | 士          | 仕           | Advisor / Guard |
| Elephant   | 象          | 相           | Elephant |
| Horse      | 馬          | 马           | Horse / Knight |
| Chariot    | 車          | 车           | Chariot / Rook |
| Cannon     | 砲          | 炮           | Cannon |
| Pawn       | 卒          | 兵           | Pawn / Soldier |

### Board Coordinates

- **X-axis (columns)**: 0-8 (left to right)
- **Y-axis (rows)**: 0-9 (top to bottom, Black territory at top)

---

## 📖 中文文档

### 简介

Node-RED 自定义节点，提供**交互式中国象棋**棋盘，支持动态 PGN 棋谱加载。适用于象棋教学、开局分析和多分支剧本化对弈。

### 功能特性

- ✅ **Canvas 原生渲染** - 纯 HTML5 Canvas，无外部依赖
- ✅ **标准 PGN 格式** - 支持加载和重播标准象棋 PGN 棋谱
- ✅ **分步回放** - 前进/后退导航浏览每一步
- ✅ **人机交互** - 点击走子，带完整规则验证
- ✅ **多分支剧本** - 支持教程剧本，包含多种应答分支
- ✅ **Dashboard 集成** - 无缝嵌入 Node-RED Dashboard
- ✅ **FEN 导出** - 导出当前局面为标准 FEN 字符串
- ✅ **中文记谱** - 原生支持传统中文记谱法

### 安装

#### 通过 Node-RED 面板安装

1. 打开 Node-RED
2. 菜单 → 节点管理 → 安装
3. 搜索 `node-red-contrib-chinese-chess`
4. 点击安装

#### 手动安装

```bash
cd ~/.node-red
npm install node-red-contrib-chinese-chess
```

安装完成后重启 Node-RED。

### 使用方法

#### 1. 基础配置

1. 从节点面板拖拽 `chinese-chess` 节点到工作区
2. 配置节点参数：
   - **组 (Group)**: 棋盘所在的 Dashboard 组
   - **尺寸 (Size)**: 组件的宽高
   - **棋盘大小 (Board Size)**: 棋盘像素尺寸
   - **视角 (Orientation)**: 红方在下 / 黑方在下（默认：红方在下）

#### 2. 输入控制

通过消息控制棋盘行为：

```javascript
// 加载 PGN 棋谱
{ payload: { action: "load", pgn: "1. 炮二平五 马8进7 2. 马二进三 车9平8" } }

// 加载 FEN 局面
{ payload: { action: "loadfen", fen: "3k5/4a4/4c4/9/9/9/9/4C4/4A4/3K5 w - - 0 1" } }

// 导航控制
{ payload: { action: "next" } }      // 下一步
{ payload: { action: "prev" } }      // 上一步  
{ payload: { action: "goto", step: 5 } }  // 跳转到第5步
{ payload: { action: "reset" } }     // 重置到初始局面

// 执行走子（坐标格式）
{ payload: { action: "move", from: [1, 7], to: [4, 7] } }
```

#### 3. 输出格式

每步合法走子后，节点输出当前状态：

```javascript
{
    payload: {
        fen: "3k5/4a4/4c4/9/9/9/9/4C4/4A4/3K5 w - - 0 1",
        pgn: "1. 炮二平五",
        pgnArray: ["炮二平五"],
        currentStep: 1,
        totalSteps: 1,
        turn: "red",
        history: [...]
    }
}
```

### 棋子说明

| 棋子类型 | 黑方（上方） | 红方（下方） | 英文名称 |
|----------|-------------|-------------|----------|
| 将/帅    | 将          | 帅          | King     |
| 士/仕    | 士          | 仕          | Advisor  |
| 象/相    | 象          | 相          | Elephant |
| 马       | 馬          | 马          | Horse    |
| 车       | 車          | 车          | Chariot  |
| 炮       | 砲          | 炮          | Cannon   |
| 卒/兵    | 卒          | 兵          | Pawn     |

### 棋盘坐标

- **X 轴（列）**: 0-8（从左到右）
- **Y 轴（行）**: 0-9（从上到下，黑方在上方）

---

## License | 许可证

MIT License

---

*Document translated to English-Chinese bilingual | 文档已翻译为中英双语*
