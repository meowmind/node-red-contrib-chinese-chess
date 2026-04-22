# Node-RED 动态象棋谱库 技术协议

## 1. 技术栈选型

### 1.1 后端（Node-RED 节点部分）
- **语言**：JavaScript
- **运行环境**：Node.js（Node-RED 要求版本 14+）
- **包管理**：npm

### 1.2 前端（棋盘渲染部分）
- **棋盘渲染库**：chessboard.js（轻量、易于集成，支持拖拽交互）
- **棋谱逻辑处理**：chess.js（支持 PGN 解析、走法验证、规则判断）
- **渲染方式**：HTML + SVG，兼容大部分浏览器
- **适配框架**：Node-RED Dashboard UI

## 2. 项目结构

```
node-red-chinese-chess/
├── nodes/
│   ├── chinese-chess.html   # 节点配置和前端渲染
│   └── chinese-chess.js     # 节点后端逻辑
├── icons/
│   └── chess.svg            # 节点图标
├── package.json             # npm 包配置
├── README.md                # 使用说明
└── LICENSE
```

## 3. Node-RED 节点定义

### 3.1 节点基本信息
- **节点类型**：`chinese-chess`
- **分类**：input（或 dashboard）
- **图标**：chess.svg
- **标签**：chinese-chess

### 3.2 节点配置项
| 配置项 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| name | string | 节点名称 | 动态象棋谱 |
| width | number | 棋盘宽度（像素） | 400 |
| height | number | 棋盘高度（像素） | 400 |
| orientation | string | 红方/黑方视角 | red |

### 3.3 输入输出规范

#### 输入（msg.payload）
支持多种输入格式：

1. **加载完整 PGN 棋谱**
```json
{
  "action": "load",
  "pgn": "1. 炮二平五 马8进7 2. 马二进三 卒7进1"
}
```

2 **下一步**
```json
{
  "action": "next"
}
```

3. **上一步**
```json
{
  "action": "prev"
}
```

4. **跳转到指定步数**
```json
{
  "action": "goto",
  "step": 5
}
```

5. **走棋（用户交互）**
```json
{
  "action": "move",
  "from": "a2",
  "to": "a3"
}
```

#### 输出（msg.payload）
当前棋盘状态：
```json
{
  "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
  "pgn": "1. 炮二平五 马8进7",
  "currentStep": 1,
  "totalSteps": 1,
  "turn": "red",
  "history": [
    {
      "from": "h2",
      "to": "e5",
      "san": "炮二平五"
    }
  ]
}
```

## 4. 前端交互协议

### 4.1 初始化
- 页面加载完成后，初始化 `Chess` 对象（chess.js）和 `Chessboard` 对象（chessboard.js）
- 监听 Node-RED 输入消息，根据 `action` 执行对应操作

### 4.2 事件
- 用户点击棋盘走棋后，触发 `move` 事件，输出当前棋盘状态到 Node-RED 流
- 步数变化时，输出更新后的状态

## 5. 数据格式规范

### 5.1 PGN 格式
使用标准 PGN（Portable Game Notation）格式存储棋谱，支持中文着法描述。

### 5.2 FEN 格式
使用标准 FEN（Forsyth-Edwards Notation）描述当前棋盘状态，适配 chess.js。

## 6. 依赖清单

```json
"dependencies": {
  "chess.js": "^1.0.0-beta.8",
  "chessboardjs": "^0.0.1"
}
```

## 7. 接口约定

- Node-RED 节点对外只提供输入输出端口，不存储历史棋谱（存储由上游节点负责）
- 所有交互通过 `msg` 传递，符合 Node-RED 设计思想
- 前端渲染自适应容器大小，支持响应式

## 8. 许可协议
MIT License
