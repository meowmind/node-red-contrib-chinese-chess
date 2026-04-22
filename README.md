# Node-RED 动态象棋谱库

Node-RED 自定义节点，用于展示和交互中国象棋动态棋谱。

## 项目简介

本项目是一个为 Node-RED 开发的自定义节点，支持在 Node-RED 中嵌入可交互的中国象棋棋盘，能够加载 PGN 格式棋谱，支持分步播放、用户交互走棋，适合制作象棋教学流程、棋谱演示等应用。

## 功能特性

- ✅ 加载标准 PGN 格式棋谱（支持中文记谱：炮二平五、马8进7）
- ✅ 分步前进/后退播放棋谱（支持按钮点击和消息控制）
- ✅ 支持用户点击交互走棋
- ✅ 支持多分支剧本，适合互动开局教学
- ✅ 适配 Node-RED Dashboard
- ✅ 输出当前棋盘状态（FEN/PGN）
- ✅ 原生 Canvas 绘制，不依赖外部前端库

## 项目结构

```
node-red-chinese-chess/
├── nodes/                # Node-RED 节点源码
│   ├── chinese-chess.html   # 节点配置界面
│   └── chinese-chess.js     # 节点后端逻辑
├── public/               # 前端静态资源
│   ├── chinese-chess-core.js # 核心逻辑
│   └── chinese-chess-ui.html # 棋盘UI模板
├── icons/                # 节点图标
├── plan/                 # 项目开发计划
│   └── project-plan.md
├── protocol/             # 技术协议文档
│   └── technical-protocol.md
├── docs/                 # 使用说明文档
├── README.md             # 项目说明（本文件）
└── package.json          # npm 包配置
```

## 安装

### 从 npm 安装（发布后）

```bash
cd ~/.node-red
npm install node-red-chinese-chess
```

### 开发安装

```bash
cd ~/.node-red/node_modules
git clone <repository-url>
cd node-red-chinese-chess
npm install
```

重启 Node-RED 后，在节点面板中可以找到 `chinese-chess` 节点。

## 使用方法

1. 拖拽 `chinese-chess` 节点到流编辑器
2. 配置棋盘大小和初始视角（红方/黑方）
3. 输入消息控制节点：
   - `{ "action": "load", "pgn": "1. 炮二平五 马8进7" }` - 加载棋谱
   - `{ "action": "next" }` - 下一步
   - `{ "action": "prev" }` - 上一步
   - `{ "action": "goto", "step": 5 }` - 跳转到指定步数
   - `{ "action": "move", "from": "a2", "to": "a3" }` - 走棋
4. 节点输出当前棋盘状态，包含 FEN、PGN、当前步数等信息，可以接入后续处理

详细使用说明和示例棋谱参见 [docs/examples.md](./docs/examples.md)。

## 技术栈

- 后端：Node.js / Node-RED
- 前端：原生 Canvas 绘制，不依赖外部库
- 数据格式：PGN / FEN
- 支持多分支剧本，适合互动教学

## 技术协议

详见 [protocol/technical-protocol.md](./protocol/technical-protocol.md)

## 开发计划

详见 [plan/project-plan.md](./plan/project-plan.md)

## 许可证

MIT License
