/**
 * 中国象棋核心 - 动态棋谱库 for Node-RED
 * 支持：多分支剧本、开局教学、交互式走子
 */

var ChineseChess = (function() {
    'use strict';

    // 棋子类型常量
    var PIECE = {
        KING: 0,      // 将/帅
        ADVISOR: 1,   // 士
        ELEPHANT: 2,  // 象/相
        HORSE: 3,     // 马
        CHARIOT: 4,   // 车
        CANNON: 5,    // 炮
        PAWN: 6       // 卒/兵
    };

    // 颜色
    var COLOR = {
        RED: 0,
        BLACK: 1
    };

    // 初始局面 FEN 格式（中国象棋 FEN）
    var INITIAL_FEN = '3k5/4a4/4c4/9/9/9/9/4C4/4A4/3K5 w - - 0 1';

    // 坐标工具：棋盘是 9x10，坐标 (x, y) x:0-8, y:0-9
    // 传统记谱转换：如 "炮二平五" -> (1, 2) -> (4, 2)

    function Board() {
        this.squares = []; // 二维数组 squares[x][y]
        this.init();
    }

    Board.prototype.init = function() {
        // 初始化空棋盘
        this.squares = [];
        for (var x = 0; x < 9; x++) {
            this.squares[x] = [];
            for (var y = 0; y < 10; y++) {
                this.squares[x][y] = null;
            }
        }
        // 摆放初始棋子
        // 红方在下（y=7-9）x:0-8
        this.place(4, 9, PIECE.KING, COLOR.RED);
        this.place(3, 9, PIECE.ADVISOR, COLOR.RED);
        this.place(5, 9, PIECE.ADVISOR, COLOR.RED);
        this.place(2, 9, PIECE.ELEPHANT, COLOR.RED);
        this.place(6, 9, PIECE.ELEPHANT, COLOR.RED);
        this.place(1, 9, PIECE.HORSE, COLOR.RED);
        this.place(7, 9, PIECE.HORSE, COLOR.RED);
        this.place(0, 9, PIECE.CHARIOT, COLOR.RED);
        this.place(8, 9, PIECE.CHARIOT, COLOR.RED);
        this.place(1, 7, PIECE.CANNON, COLOR.RED);
        this.place(7, 7, PIECE.CANNON, COLOR.RED);
        for (var i = 0; i < 5; i++) {
            this.place(i * 2, 6, PIECE.PAWN, COLOR.RED);
        }

        // 黑方在上（y=0-2）
        this.place(4, 0, PIECE.KING, COLOR.BLACK);
        this.place(3, 0, PIECE.ADVISOR, COLOR.BLACK);
        this.place(5, 0, PIECE.ADVISOR, COLOR.BLACK);
        this.place(2, 0, PIECE.ELEPHANT, COLOR.BLACK);
        this.place(6, 0, PIECE.ELEPHANT, COLOR.BLACK);
        this.place(1, 0, PIECE.HORSE, COLOR.BLACK);
        this.place(7, 0, PIECE.HORSE, COLOR.BLACK);
        this.place(0, 0, PIECE.CHARIOT, COLOR.BLACK);
        this.place(8, 0, PIECE.CHARIOT, COLOR.BLACK);
        this.place(1, 2, PIECE.CANNON, COLOR.BLACK);
        this.place(7, 2, PIECE.CANNON, COLOR.BLACK);
        for (var i = 0; i < 5; i++) {
            this.place(i * 2, 3, PIECE.PAWN, COLOR.BLACK);
        }
    };

    Board.prototype.place = function(x, y, type, color) {
        this.squares[x][y] = {
            type: type,
            color: color
        };
    };

    Board.prototype.get = function(x, y) {
        if (x < 0 || x >= 9 || y < 0 || y >= 10) return null;
        return this.squares[x][y];
    };

    // 统计两点之间棋子个数（不含起点终点，用于车、炮、象）
    Board.prototype.countPiecesBetween = function(fromX, fromY, toX, toY) {
        var count = 0;
        if (fromX === toX) {
            // 竖线
            var minY = Math.min(fromY, toY);
            var maxY = Math.max(fromY, toY);
            for (var y = minY + 1; y < maxY; y++) {
                if (this.get(fromX, y)) count++;
            }
        } else if (fromY === toY) {
            // 横线
            var minX = Math.min(fromX, toX);
            var maxX = Math.max(fromX, toX);
            for (var x = minX + 1; x < maxX; x++) {
                if (this.get(x, fromY)) count++;
            }
        } else {
            // 斜线，不处理，只有象走斜线
            var dx = Math.abs(toX - fromX);
            var dy = Math.abs(toY - fromY);
            if (dx === 2 && dy === 2) {
                // 象走田，检查中间眼
                var midX = (fromX + toX) / 2;
                var midY = (fromY + toY) / 2;
                if (this.get(midX, midY)) count++;
            }
        }
        return count;
    };

    // 验证走法是否符合中国象棋规则
    Board.prototype.isValidMove = function(fromX, fromY, toX, toY) {
        var piece = this.get(fromX, fromY);
        if (!piece) return false;
        var target = this.get(toX, toY);
        // 不能吃自己棋子
        if (target && target.color === piece.color) return false;

        var dx = Math.abs(toX - fromX);
        var dy = Math.abs(toY - fromY);

        switch (piece.type) {
            case PIECE.KING: // 将/帅
                // 不能出九宫：九宫范围 x 3~5, y: 红 7~9, 黑 0~2
                if (toX < 3 || toX > 5) return false;
                if (piece.color === COLOR.RED) {
                    if (toY < 7 || toY > 9) return false;
                } else {
                    if (toY < 0 || toY > 2) return false;
                }
                // 将帅不能直接对面
                if (dx === 0) {
                    var count = this.countPiecesBetween(fromX, fromY, toX, toY);
                    if (count === 0 && target && target.type === PIECE.KING) {
                        return false; // 对面直接对脸，不允许
                    }
                }
                // 一次只能走一格
                return (dx + dy) === 1;

            case PIECE.ADVISOR: // 士
                // 不能出九宫
                if (toX < 3 || toX > 5) return false;
                if (piece.color === COLOR.RED) {
                    if (toY < 7 || toY > 9) return false;
                } else {
                    if (toY < 0 || toY > 2) return false;
                }
                // 只能斜走一格
                return dx === 1 && dy === 1;

            case PIECE.ELEPHANT: // 象/相
                // 不能过河
                if (piece.color === COLOR.RED) {
                    if (toY < 5) return false; // 红相不能过楚河汉界到y<5
                } else {
                    if (toY > 4) return false; // 黑象不能过楚河汉界到y>4
                }
                // 必须走田字
                if (dx !== 2 || dy !== 2) return false;
                // 塞象眼：中间不能有棋子
                var midX = (fromX + toX) / 2;
                var midY = (fromY + toY) / 2;
                if (this.get(midX, midY)) return false; // 塞象眼，不允许
                return true;

            case PIECE.HORSE: // 马
                // 必须走日
                if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) return false;
                // 蹩马腿：检查马脚位置是否有子
                var hx = fromX + (dx === 2 ? (toX > fromX ? 1 : -1) : 0);
                var hy = fromY + (dy === 2 ? (toY > fromY ? 1 : -1) : 0);
                if (this.get(hx, hy)) return false; // 蹩马腿，不允许
                return true;

            case PIECE.CHARIOT: // 车
                // 必须走直线
                if (dx !== 0 && dy !== 0) return false;
                // 中间不能有棋子阻挡
                var count = this.countPiecesBetween(fromX, fromY, toX, toY);
                return count === 0;

            case PIECE.CANNON: // 炮
                // 必须走直线
                if (dx !== 0 && dy !== 0) return false;
                var count = this.countPiecesBetween(fromX, fromY, toX, toY);
                if (!target) {
                    // 不吃子：必须中间无子
                    return count === 0;
                } else {
                    // 吃子：必须恰好一个炮架
                    return count === 1;
                }

            case PIECE.PAWN: // 卒/兵
                // 没过河：只能前进一格
                if (piece.color === COLOR.RED) { // 红兵向下（y减小）
                    if (fromY > 5) { // 还没过河（楚河汉界在 y=4~5 之间，y>5 就是未过河）
                        if (dy !== 1 || toY >= fromY) return false; // 只能前进一步
                        return dx === 0;
                    }
                } else { // 黑卒向上（y增大）
                    if (fromY < 4) { // 还没过河（楚河汉界在 y=4~5 之间，y<4 就是未过河）
                        if (dy !== 1 || toY <= fromY) return false; // 只能前进一步
                        return dx === 0;
                    }
                }
                // 过河了：可以前进或左右横走，每次一格
                if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                    // 兵不能后退
                    if (piece.color === COLOR.RED) {
                        if (toY > fromY) return false; // 红兵不能后退（y增大是后退）
                    } else {
                        if (toY < fromY) return false; // 黑卒不能后退（y减小是后退）
                    }
                    return true;
                }
                return false;

            default:
                return false;
        }
    };

    Board.prototype.move = function(fromX, fromY, toX, toY) {
        var piece = this.get(fromX, fromY);
        if (!piece) {
            console.log('node-red-chinese-chess: move error: no piece at ' + fromX + ',' + fromY);
            return null;
        }
        var captured = this.get(toX, toY);
        this.squares[toX][toY] = piece;
        this.squares[fromX][fromY] = null;
        return {
            from: {x: fromX, y: fromY},
            to: {x: toX, y: toY},
            captured: captured
        };
    };

    // 字符串表示走法 如 "h2e2" 或者 "炮二平五"
    // 这里用坐标简写 例：从 (7, 2) 到 (4, 2) -> "7242"

    function parseMoveStr(moveStr) {
        // 格式: "fromXfromYtoXtoY"
        if (moveStr.length === 4) {
            return {
                fromX: parseInt(moveStr[0], 10),
                fromY: parseInt(moveStr[1], 10),
                toX: parseInt(moveStr[2], 10),
                toY: parseInt(moveStr[3], 10)
            };
        }
        return null;
    }

    function moveToString(fromX, fromY, toX, toY) {
        return fromX + '' + fromY + toX + '' + toY;
    }

    // =========================
    // 剧本树数据结构
    // =========================
    // {
    //   id: "root",
    //   note: "顺炮横车对直车",
    //   branches: [
    //     {
    //       move: "1242",  // 炮二平五
    //       label: "正着",
    //       type: "main", // main/soft/trap/knife
    //       note: "这是最常见的开局",
    //       next: "node1"
    //     }
    //   ],
    //   next: {} // 也可以直接内嵌
    // }

    function Game(options) {
        this.board = new Board();
        this.history = [];
        this.currentNode = null;
        this.currentMoveIndex = 0;
        this.script = options.script || null;
        this.onEvent = options.onEvent || function() {};
        this.recording = true; // 默认正在记录
    }

    Game.prototype.reset = function() {
        this.board = new Board();
        this.history = [];
        this.currentMoveIndex = 0;
        this.recording = true;
        if (this.script && this.script.root) {
            this.currentNode = this.script.root;
        }
        this.triggerEvent('reset', null);
    };

    // 开始记录（在回退到某步后开始新分支）
    Game.prototype.startRecording = function() {
        this.recording = true;
        this.triggerEvent('recording-start', {recording: this.recording});
    };

    // 结束记录（归档当前历史，回退后走新步不会改变原记录）
    Game.prototype.stopRecording = function() {
        this.recording = false;
        this.triggerEvent('recording-stop', {recording: this.recording});
    };

    // 获取当前记录状态
    Game.prototype.isRecording = function() {
        return this.recording;
    };

    // 从任意字符串中提取 FEN
    function extractFEN(str) {
        if (typeof str !== 'string') return null;
        
        // 中国象棋 FEN 特征：10行，每行数字+字母组成，用 / 分隔
        // 匹配模式：寻找包含 9 个 / 的连续字符串，且字符为 FEN 合法字符
        var fenChars = 'KKAEEHH RRCCPP kkaeehhrrccpp123456789/';
        
        // 尝试从字符串中提取可能的 FEN 片段
        var lines = str.split('/');
        for (var start = 0; start <= lines.length - 10; start++) {
            var candidate = lines.slice(start, start + 10).join('/');
            // 检查是否基本符合 FEN 格式（只包含 FEN 合法字符）
            var valid = true;
            for (var i = 0; i < candidate.length; i++) {
                var c = candidate[i];
                if ('KAEHRCPkaehrcp123456789/NBnb'.indexOf(c) < 0) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                // 检查每行总宽度是否为9
                var rows = candidate.split('/');
                var allRowsValid = true;
                for (var j = 0; j < rows.length; j++) {
                    var row = rows[j];
                    var width = 0;
                    for (var k = 0; k < row.length; k++) {
                        var ch = row[k];
                        if (!isNaN(parseInt(ch))) {
                            width += parseInt(ch, 10);
                        } else {
                            width++;
                        }
                    }
                    if (width !== 9) {
                        allRowsValid = false;
                        break;
                    }
                }
                if (allRowsValid) {
                    return candidate;
                }
            }
        }
        return str.trim(); // 没找到就返回原字符串
    }

    // FEN 字符转换（兼容模式）
    function normalizeFENChar(c) {
        // 兼容国际象棋记法：N->H (马), B->E (象)
        var upper = c.toUpperCase();
        if (upper === 'N') return c === 'N' ? 'H' : 'h';
        if (upper === 'B') return c === 'B' ? 'E' : 'e';
        return c;
    }

    // FEN 合法性校验（兼容模式）
    function validateFEN(fen, options) {
        options = options || {};
        var compatible = options.compatible !== false; // 默认开启兼容模式
        
        var errors = [];
        var warnings = [];
        
        // 先尝试提取 FEN
        var extracted = extractFEN(fen);
        if (extracted !== fen) {
            warnings.push('已从字符串中提取 FEN');
            fen = extracted;
        }
        
        var fenParts = fen.split(' ');
        var boardPart = fenParts[0];
        var rows = boardPart.split('/');
        
        // 检查行数
        if (rows.length !== 10) {
            errors.push('FEN 行数错误：应有 10 行，实际 ' + rows.length + ' 行');
            return { valid: false, errors: errors, warnings: warnings };
        }

        // 统计棋子
        var counts = {
            red: { K: 0, A: 0, E: 0, H: 0, R: 0, C: 0, P: 0 },
            black: { K: 0, A: 0, E: 0, H: 0, R: 0, C: 0, P: 0 }
        };

        // 兼容模式下支持更多字符
        var validChars = { 'K':1, 'A':1, 'E':1, 'H':1, 'R':1, 'C':1, 'P':1, 'k':1, 'a':1, 'e':1, 'h':1, 'r':1, 'c':1, 'p':1, '1':1, '2':1, '3':1, '4':1, '5':1, '6':1, '7':1, '8':1, '9':1 };
        if (compatible) {
            // 兼容国际象棋记法
            validChars['N'] = 1; validChars['n'] = 1; // N = 马
            validChars['B'] = 1; validChars['b'] = 1; // B = 象
        }

        for (var y = 0; y < 10; y++) {
            var row = rows[y];
            var x = 0;
            for (var i = 0; i < row.length; i++) {
                var c = row[i];
                
                // 检查字符合法性
                if (!validChars[c]) {
                    errors.push('非法字符 "' + c + '" 在第 ' + (y + 1) + ' 行第 ' + (i + 1) + ' 位');
                    continue;
                }

                // 兼容模式转换
                if (compatible) {
                    var originalC = c;
                    c = normalizeFENChar(c);
                    if (originalC !== c) {
                        warnings.push('兼容模式：' + originalC + ' 转换为 ' + c);
                    }
                }

                if (!isNaN(parseInt(c))) {
                    var empty = parseInt(c, 10);
                    x += empty;
                } else {
                    var isRed = c.toUpperCase() === c;
                    var type = c.toUpperCase();
                    if (isRed) {
                        counts.red[type]++;
                    } else {
                        counts.black[type]++;
                    }

                    // 检查将帅位置（九宫）
                    if (type === 'K') {
                        var kingX = x;
                        var kingY = y;
                        if (kingX < 3 || kingX > 5) {
                            errors.push('将/帅 x 坐标超出九宫：' + kingX + ' (应为 3-5)');
                        }
                        if (isRed) {
                            if (kingY < 7 || kingY > 9) {
                                errors.push('红帅 y 坐标超出九宫：' + kingY + ' (应为 7-9)');
                            }
                        } else {
                            if (kingY < 0 || kingY > 2) {
                                errors.push('黑将 y 坐标超出九宫：' + kingY + ' (应为 0-2)');
                            }
                        }
                    }
                    x++;
                }
            }
            // 检查每行宽度
            if (x !== 9) {
                errors.push('第 ' + (y + 1) + ' 行宽度错误：应有 9 列，实际 ' + x + ' 列');
            }
        }

        // 检查棋子数量限制
        var limits = { K: 1, A: 2, E: 2, H: 2, R: 2, C: 2, P: 5 };
        var names = { K: '将/帅', A: '士/仕', E: '象/相', H: '马', R: '车', C: '炮', P: '卒/兵' };
        
        for (var t in limits) {
            if (counts.red[t] > limits[t]) {
                errors.push('红方 ' + names[t] + ' 数量超限：' + counts.red[t] + ' 个 (最多 ' + limits[t] + ' 个)');
            }
            if (counts.black[t] > limits[t]) {
                errors.push('黑方 ' + names[t] + ' 数量超限：' + counts.black[t] + ' 个 (最多 ' + limits[t] + ' 个)');
            }
        }

        // 检查必须有将帅
        if (counts.red.K === 0) {
            errors.push('红方缺少帅');
        }
        if (counts.black.K === 0) {
            errors.push('黑方缺少将');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            counts: counts,
            normalizedFEN: fen
        };
    }

    // 从 FEN 加载局面
    Game.prototype.loadFEN = function(fen) {
        // 先校验 FEN 合法性（兼容模式）
        var validation = validateFEN(fen, { compatible: true });
        if (!validation.valid) {
            var errorMsg = 'FEN 校验失败：\n' + validation.errors.join('\n');
            console.log('node-red-chinese-chess: ' + errorMsg);
            this.triggerEvent('loadfen_error', { fen: fen, errors: validation.errors });
            return false;
        }

        // 使用归一化后的 FEN
        fen = validation.normalizedFEN;

        // 重置棋盘，但不摆放初始棋子（完全清空）
        this.board = new Board();
        // 清空棋盘所有位置
        for (var y = 0; y < 10; y++) {
            for (var x = 0; x < 9; x++) {
                this.board.squares[x][y] = null;
            }
        }
        this.history = [];
        this.currentMoveIndex = 0;
        this.recording = true;

        // FEN 格式中国象棋版本：第一部分是棋盘
        var fenParts = fen.split(' ');
        var boardPart = fenParts[0];
        var rows = boardPart.split('/');

        var x = 0;
        var y = 0;
        for (y = 0; y < 10; y++) {
            var row = rows[y];
            x = 0;
            for (var i = 0; i < row.length; i++) {
                var c = row[i];
                if (!isNaN(parseInt(c))) {
                    // 连续空格子
                    var empty = parseInt(c, 10);
                    x += empty;
                } else {
                    // 兼容模式字符转换
                    c = normalizeFENChar(c);
                    
                    // 棋子
                    var color = c.toUpperCase() === c ? COLOR.RED : COLOR.BLACK;
                    var typeMap = {
                        'K': PIECE.KING, 'k': PIECE.KING,
                        'A': PIECE.ADVISOR, 'a': PIECE.ADVISOR,
                        'E': PIECE.ELEPHANT, 'e': PIECE.ELEPHANT,
                        'H': PIECE.HORSE, 'h': PIECE.HORSE,
                        'R': PIECE.CHARIOT, 'r': PIECE.CHARIOT,
                        'C': PIECE.CANNON, 'c': PIECE.CANNON,
                        'P': PIECE.PAWN, 'p': PIECE.PAWN
                    };
                    var type = typeMap[c.toUpperCase()];
                    if (typeof type !== 'undefined') {
                        this.board.place(x, y, type, color);
                    }
                    x++;
                }
            }
        }
        this.triggerEvent('loadfen', {fen: fen, validation: validation});
        // 加载成功后输出完整状态（同 move 事件格式）
        this.triggerEvent('move', {
            fen: this.getFEN(),
            history: this.history,
            currentStep: this.currentMoveIndex,
            totalSteps: this.history.length,
            turn: this.currentMoveIndex % 2 === 0 ? 'red' : 'black'
        });
        return true;
    };

    // 获取当前局面 FEN
    Game.prototype.getFEN = function() {
        var fen = '';
        for (var y = 0; y < 10; y++) {
            var empty = 0;
            for (var x = 0; x < 9; x++) {
                var piece = this.board.get(x, y);
                if (!piece) {
                    empty++;
                } else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    var p = ['K', 'A', 'E', 'H', 'R', 'C', 'P'][piece.type];
                    if (piece.color === COLOR.RED) {
                        fen += p.toUpperCase();
                    } else {
                        fen += p.toLowerCase();
                    }
                }
            }
            if (empty > 0) {
                fen += empty;
            }
            if (y < 9) fen += '/';
        }
        // 基本 FEN 格式，省略其他部分
        fen += ' ' + (this.history.length % 2 === 0 ? 'w' : 'b') + ' - - 0 1';
        return fen;
    };


    Game.prototype.move = function(fromX, fromY, toX, toY) {
        // 先验证走法符合象棋规则
        if (!this.board.isValidMove(fromX, fromY, toX, toY)) {
            console.log('node-red-chinese-chess: game.move: rule violation', fromX, fromY, toX, toY);
            return false;
        }
        // 走子前先获取棋子信息（用于 PGN 记谱）
        var piece = this.board.get(fromX, fromY);
        var result = this.board.move(fromX, fromY, toX, toY);
        if (!result) {
            console.log('node-red-chinese-chess: game.move: invalid move', fromX, fromY, toX, toY);
            return false;
        }
        var moveStr = moveToString(fromX, fromY, toX, toY);
        var moveObj = {
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            moveStr: moveStr,
            piece: piece,  // 保存棋子信息用于记谱
            pieceType: piece ? piece.type : null,
            pieceColor: piece ? piece.color : null
        };

        // 分支处理逻辑
        if (this.recording) {
            // 正在记录：截断当前位置后面的历史，添加新走法
            if (this.currentMoveIndex < this.history.length) {
                // 回退到中间某步后走新棋，截断后面的历史，开始新分支
                this.history = this.history.slice(0, this.currentMoveIndex);
            }
            this.history.push(moveObj);
            this.currentMoveIndex = this.history.length;
        } else {
            // 未在记录：不允许修改历史，只验证走法显示棋盘，但不记录
            // 如果确实在末尾，可以添加
            if (this.currentMoveIndex === this.history.length) {
                this.history.push(moveObj);
                this.currentMoveIndex = this.history.length;
            }
            // 如果在中间，未记录状态不允许修改原历史
            // 只在棋盘上显示，但不保存到历史
            // 用户需要点击开始记录才能继续
        }

        this.triggerEvent('move', {
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            moveStr: moveStr,
            currentMoveIndex: this.currentMoveIndex,
            totalSteps: this.history.length,
            history: this.history,
            recording: this.recording
        });
        return true;
    };

    Game.prototype.back = function() {
        // 已经到最开始了，不能再回退
        if (this.currentMoveIndex <= 0) return false;
        this.currentMoveIndex--;
        var targetIndex = this.currentMoveIndex;
        // 保存完整历史，重新创建空棋盘，然后重放
        var savedHistory = this.history;
        var savedScript = this.script;
        var savedCurrentNode = this.currentNode;
        var savedPgnMoves = this.pgnMoves;
        this.board = new Board();
        this.history = savedHistory;
        this.script = savedScript;
        this.currentNode = savedCurrentNode;
        this.pgnMoves = savedPgnMoves;
        for (var i = 0; i < this.currentMoveIndex; i++) {
            var m = this.history[i];
            // 回退/前进不验证规则，直接重放历史走法
            this.board.move(m.fromX, m.fromY, m.toX, m.toY);
        }
        this.triggerEvent('back', {index: this.currentMoveIndex});
        this.triggerEvent('move', {index: this.currentMoveIndex});
        return true;
    };

    Game.prototype.next = function() {
        // 如果有剧本，走下一步
        if (this.currentNode && this.currentNode.branches && this.currentNode.branches.length > 0) {
            var b = this.currentNode.branches[0]; // 默认走主分支
            var m = ChineseChess.parseMoveStr(b.move);
            if (m) {
                this.move(m.fromX, m.fromY, m.toX, m.toY);
                if (b.next) {
                    this.currentNode = typeof b.next === 'object' ? b.next : getNodeById(this.script, b.next);
                }
                return true;
            }
        }
        // 如果是 PGN 加载模式，走下一步
        if (this.pgnMoves && this.currentMoveIndex < this.pgnMoves.length) {
            var moveText = this.pgnMoves[this.currentMoveIndex];
            var coord = ChineseChess.chineseMoveToCoordinate(moveText, this);
            if (coord) {
                this.move(coord.fromX, coord.fromY, coord.toX, coord.toY);
                return true;
            }
        }
        // 普通历史前进（回退后继续前进）
        if (this.currentMoveIndex < this.history.length) {
            this.currentMoveIndex++;
            var targetIndex = this.currentMoveIndex;
            // 保存完整历史，重新创建空棋盘，然后重放
            var savedHistory = this.history;
            var savedScript = this.script;
            var savedCurrentNode = this.currentNode;
            var savedPgnMoves = this.pgnMoves;
            this.board = new Board();
            this.history = savedHistory;
            this.script = savedScript;
            this.currentNode = savedCurrentNode;
            this.pgnMoves = savedPgnMoves;
            for (var i = 0; i < this.currentMoveIndex; i++) {
                var m = this.history[i];
                this.board.move(m.fromX, m.fromY, m.toX, m.toY);
            }
            this.triggerEvent('next', {index: this.currentMoveIndex});
            this.triggerEvent('move', {index: this.currentMoveIndex});
            return true;
        }
        return false;
    };

    Game.prototype.goto = function(step) {
        if (step < 0) step = 0;
        if (step > this.history.length) step = this.history.length;
        var targetIndex = step;
        this.currentMoveIndex = targetIndex;
        // 保存完整历史，重新创建空棋盘，然后重放
        var savedHistory = this.history;
        var savedScript = this.script;
        var savedCurrentNode = this.currentNode;
        var savedPgnMoves = this.pgnMoves;
        this.board = new Board();
        this.history = savedHistory;
        this.script = savedScript;
        this.currentNode = savedCurrentNode;
        this.pgnMoves = savedPgnMoves;
        for (var i = 0; i < step; i++) {
            var m = this.history[i];
            this.board.move(m.fromX, m.fromY, m.toX, m.toY);
        }
        this.triggerEvent('goto', {step: step});
        this.triggerEvent('move', {step: step});
        return true;
    };

    function getNodeById(script, id) {
        if (!script || !script.nodes) return null;
        return script.nodes.find(function(n) { return n.id === id; });
    }

    // PGN 解析，支持中文记谱
    function parsePGN(pgn) {
        var moves = [];
        // 简单分词，提取着法
        var tokens = pgn.split(/\s+/);
        var moveRegex = /^\d+\.(.*)$/;
        tokens.forEach(function(t) {
            var match = t.match(moveRegex);
            if (match) {
                var m = match[1];
                if (m) moves.push(m);
            } else if (t && !t.includes('[') && !t.includes(']') && !t.startsWith('[')) {
                moves.push(t);
            }
        });
        return moves;
    }

    // 加载完整 PGN 并走完所有步骤
    Game.prototype.loadPGN = function(pgn) {
        var moves = parsePGN(pgn);
        this.pgnMoves = moves;
        var successCount = 0;
        this.reset();
        // 默认加载后不全部走完，留给分步播放
        return {
            total: moves.length,
            success: successCount
        };
    };


    // 中文数字映射
    var chineseNum = {'一': 0, '二': 1, '三': 2, '四': 3, '五': 4, '六': 5, '七': 6, '八': 7, '九': 8};
    var chineseNumReverse = {'一': 8, '二': 7, '三': 6, '四': 5, '五': 4, '六': 3, '七': 2, '八': 1, '九': 0};

    // 将中文记谱转换为坐标
    // 格式：炮二平五、马8进7 等，支持中文数字和阿拉伯数字
    function chineseMoveToCoordinate(moveText, game) {
        // 去除空格
        moveText = moveText.trim();
        if (moveText.length < 4) return null;

        var board = game.board;
        var pieceChar = moveText[0];

        // 所有棋子名称映射
        var pieceNamesAll = {
            '帅': PIECE.KING, '将': PIECE.KING,
            '仕': PIECE.ADVISOR, '士': PIECE.ADVISOR,
            '相': PIECE.ELEPHANT, '象': PIECE.ELEPHANT,
            '马': PIECE.HORSE,
            '车': PIECE.CHARIOT,
            '炮': PIECE.CANNON,
            '兵': PIECE.PAWN, '卒': PIECE.PAWN
        };
        var pieceType = pieceNamesAll[pieceChar];
        if (pieceType === undefined || pieceType === null) {
            return null;
        }

        // 关键1：起点数字本身判断颜色！
        // 中文数字（一~九）→ 红方，阿拉伯数字（1~9）→ 黑方
        var fromNumStr = moveText[1];
        var isRedMove = chineseNum.hasOwnProperty(fromNumStr);

        // 关键2：检查轮次，不匹配直接返回 null
        // 用 currentMoveIndex 而不是 history.length，因为回退后历史长度不变
        var expectedIsRed = (game.currentMoveIndex % 2 === 0);
        if (isRedMove !== expectedIsRed) {
            console.log("[chinese-chess] 轮次错误，期望" + (expectedIsRed ? "红方" : "黑方") + "走棋");
            return null;
        }

        // 解析：棋+起点+走法+终点
        var action = moveText[2];
        var toNumStr = moveText[3];

        // 获取起点 x 坐标
        var fromX = null;
        if (isRedMove) {
            // 红方：中文数字，从右数（一→8, 二→7, ..., 九→0）
            fromX = 8 - chineseNum[fromNumStr];
        } else if (!isNaN(parseInt(fromNumStr))) {
            // 黑方：阿拉伯数字，从左数（1→0, 2→1, ..., 9→8）
            var n = parseInt(fromNumStr) - 1;
            fromX = n;
        }

        if (fromX === null) return null;

        // 查找起点 y 坐标：在 fromX 列查找对应颜色和类型的棋子
        var fromY = null;
        var targetColor = isRedMove ? COLOR.RED : COLOR.BLACK;
        
        // 先正序查找
        for (var y = 0; y < 10; y++) {
            var p = board.get(fromX, y);
            if (p && p.type === pieceType && p.color === targetColor) {
                fromY = y;
                break;
            }
        }
        if (fromY === null) {
            // 逆序查找
            for (var y = 9; y >= 0; y--) {
                var p = board.get(fromX, y);
                if (p && p.type === pieceType && p.color === targetColor) {
                    fromY = y;
                    break;
                }
            }
        }
        if (fromY === null) return null;

        // 获取终点 x/y
        var toX = null;
        var toY = null;

        if (action === '平' || action === '进' || action === '退') {
            if (action === '平') {
                // 横线移动：toNumStr 是终点列
                if (isRedMove) {
                    toX = 8 - chineseNum[toNumStr]; // 红方中文数字，从右数
                } else {
                    toX = parseInt(toNumStr) - 1; // 黑方阿拉伯数字，从左数
                }
                toY = fromY;
            } else if (action === '进' || action === '退') {
                // 进/退：区分棋子类型
                // 车、炮、将/帅：toNumStr 是步数（走几格）
                // 马、相/象、仕/士：toNumStr 是终点列（x坐标）
                // 兵/卒：toNumStr 是步数（一步）
                var isStepType = (pieceType === PIECE.CHARIOT || pieceType === PIECE.CANNON || pieceType === PIECE.KING);
                var isColumnType = (pieceType === PIECE.HORSE || pieceType === PIECE.ELEPHANT || pieceType === PIECE.ADVISOR);
                
                if (isStepType) {
                    // 步数类型：计算 y 变化
                    var steps = isRedMove ? chineseNum[toNumStr] + 1 : parseInt(toNumStr);
                    if (action === '进') {
                        toY = isRedMove ? (fromY - steps) : (fromY + steps);
                    } else {
                        toY = isRedMove ? (fromY + steps) : (fromY - steps);
                    }
                    toX = fromX; // 直线走，x 不变
                } else if (isColumnType) {
                    // 列类型：toNumStr 是终点列
                    if (isRedMove) {
                        toX = 8 - chineseNum[toNumStr]; // 红方中文数字，从右数
                    } else {
                        toX = parseInt(toNumStr) - 1; // 黑方阿拉伯数字，从左数
                    }
                    // toY 需要根据棋子走法规则计算
                    // 简单处理：调用 isValidMove 遍历查找
                    // 这里暂时用近似：马走日，象走田等
                } else {
                    // 兵/卒
                    if (action === '进') {
                        // 前进：只能走一步
                        toY = isRedMove ? (fromY - 1) : (fromY + 1);
                        toX = fromX; // 未过河只能前进
                    }
                    // 兵横走是 "平"，已经在上面处理了
                }
            }
        }

        if (toX === null || toY === null) return null;

        // 边界检查
        if (toX < 0 || toX >= 9 || toY < 0 || toY >= 10) return null;

        return {
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY
        };
    }



    Game.prototype.matchBranch = function(moveStr) {
        if (!this.currentNode || !this.currentNode.branches) return null;
        for (var i = 0; i < this.currentNode.branches.length; i++) {
            var b = this.currentNode.branches[i];
            if (b.move === moveStr) {
                return b;
            }
        }
        return null;
    };

    Game.prototype.triggerEvent = function(event, data) {
        if (this.onEvent) {
            this.onEvent(event, data);
        }
    };

    // =========================
    // 渲染器
    // =========================

    function Renderer(game, container, options) {
        this.game = game;
        this.container = container;
        this.options = options || {};
        this.size = options.size || 400;
        this.selected = null; // {x,y}
        // 移动动画状态
        this.animating = null; // {piece, fromX, fromY, toX, toY, progress, startTime}
        this.animationId = null;
        this.initCanvas();
        this.render();
        this.bindEvents();
        this.startAnimationLoop();
    }

    Renderer.prototype.initCanvas = function() {
        // 添加 padding 给外边框和坐标编号
        var padding = (this.size / 9) * 0.5;
        var cellSize = this.size / 9;
        var totalHeight = cellSize * 10 + padding * 2;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size + padding * 2;
        this.canvas.height = totalHeight;
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = cellSize;
        this.padding = padding;
        this.container.appendChild(this.canvas);

        if (this.options.showControls) {
            this.addControls();
        }
    };

    Renderer.prototype.addControls = function() {
        var controlsDiv = document.createElement('div');
        controlsDiv.style.marginTop = '10px';
        controlsDiv.style.textAlign = 'center';

        var btnPrev = document.createElement('button');
        btnPrev.textContent = '上一步';
        btnPrev.style.margin = '0 5px';
        btnPrev.onclick = (function() {
            this.game.back();
            this.render();
        }).bind(this);

        var btnNext = document.createElement('button');
        btnNext.textContent = '下一步';
        btnNext.style.margin = '0 5px';
        btnNext.onclick = (function() {
            this.game.next();
            this.render();
        }).bind(this);

        var btnReset = document.createElement('button');
        btnReset.textContent = '重置';
        btnReset.style.margin = '0 5px';
        btnReset.onclick = (function() {
            this.game.reset();
            this.render();
        }).bind(this);

        controlsDiv.appendChild(btnPrev);
        controlsDiv.appendChild(btnNext);
        controlsDiv.appendChild(btnReset);

        // 添加记录控制
        var recordDiv = document.createElement('div');
        recordDiv.style.marginTop = '8px';

        // 状态指示
        this.statusSpan = document.createElement('span');
        this.statusSpan.style.padding = '4px 8px';
        this.statusSpan.style.borderRadius = '4px';
        this.updateRecordingStatus();

        var btnRecordToggle = document.createElement('button');
        btnRecordToggle.textContent = this.game.isRecording() ? '结束记录' : '开始记录';
        btnRecordToggle.style.margin = '0 5px';
        btnRecordToggle.onclick = (function() {
            if (this.game.isRecording()) {
                this.game.stopRecording();
            } else {
                this.game.startRecording();
            }
            this.updateRecordingStatus();
            btnRecordToggle.textContent = this.game.isRecording() ? '结束记录' : '开始记录';
            this.render();
        }).bind(this);

        recordDiv.appendChild(this.statusSpan);
        recordDiv.appendChild(btnRecordToggle);
        controlsDiv.appendChild(document.createElement('br'));
        controlsDiv.appendChild(recordDiv);

        this.container.appendChild(controlsDiv);
    };

    Renderer.prototype.updateRecordingStatus = function() {
        if (!this.statusSpan) return;
        if (this.game.isRecording()) {
            this.statusSpan.textContent = '● 正在记录';
            this.statusSpan.style.backgroundColor = '#e6ffed';
            this.statusSpan.style.color = '#2da44e';
        } else {
            this.statusSpan.textContent = '○ 已归档（只读）';
            this.statusSpan.style.backgroundColor = '#fff1f0';
            this.statusSpan.style.color = '#cf1322';
        }
    };

    Renderer.prototype.coordToPixel = function(x, y) {
        var cx = (x + 0.5) * this.cellSize + this.padding;
        var cy = (y + 0.5) * this.cellSize + this.padding;
        return {x: cx, y: cy};
    };

    Renderer.prototype.pixelToCoord = function(px, py) {
        px -= this.padding;
        py -= this.padding;
        var x = Math.floor(px / this.cellSize);
        var y = Math.floor(py / this.cellSize);
        if (x < 0 || x >= 9 || y < 0 || y >= 10) return null;
        return {x: x, y: y};
    };

    // 启动动画循环
    Renderer.prototype.startAnimationLoop = function() {
        var self = this;
        function animate() {
            if (self.animating) {
                var now = Date.now();
                var elapsed = now - self.animating.startTime;
                var duration = 200; // 动画时长 200ms
                self.animating.progress = Math.min(elapsed / duration, 1);
                
                if (self.animating.progress >= 1) {
                    // 动画结束，清除状态（实际走棋已在开始时完成）
                    self.animating = null;
                }
                self.render();
            }
            self.animationId = requestAnimationFrame(animate);
        }
        this.animationId = requestAnimationFrame(animate);
    };

    // 触发移动动画
    Renderer.prototype.triggerMoveAnimation = function(fromX, fromY, toX, toY, piece) {
        this.animating = {
            piece: piece,
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            progress: 0,
            startTime: Date.now()
        };
    };

    Renderer.prototype.render = function() {
        var ctx = this.ctx;
        var cellSize = this.cellSize;
        var padding = this.padding;

        // 清空 - 外背景色
        ctx.fillStyle = '#e8dcc8'; // 页面背景色
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 画木纹棋盘背景 - 使用渐变模拟真实木纹
        var boardGradient = ctx.createLinearGradient(padding, padding, padding, padding + cellSize * 10);
        boardGradient.addColorStop(0, '#e8c99e');
        boardGradient.addColorStop(0.3, '#deb887');
        boardGradient.addColorStop(0.5, '#d4a76a');
        boardGradient.addColorStop(0.7, '#deb887');
        boardGradient.addColorStop(1, '#e8c99e');
        ctx.fillStyle = boardGradient;
        ctx.beginPath();
        ctx.roundRect(padding, padding, this.size, cellSize * 10, cellSize/2);
        ctx.fill();

        // 单独绘制外边框 - 底部边框使用细线，不和格线叠加
        // 顶部边框（粗）
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding + this.size, padding);
        ctx.stroke();
        
        // 左右边框（粗）
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + cellSize * 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding + this.size, padding);
        ctx.lineTo(padding + this.size, padding + cellSize * 10);
        ctx.stroke();
        
        // 底部边框（细）
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding + cellSize * 10);
        ctx.lineTo(padding + this.size, padding + cellSize * 10);
        ctx.stroke();

        // 添加木纹纹理线条
        ctx.strokeStyle = 'rgba(180, 140, 100, 0.15)';
        ctx.lineWidth = 1;
        for (var lineY = padding + 5; lineY < padding + cellSize * 10 - 5; lineY += 8) {
            ctx.beginPath();
            ctx.moveTo(padding + 3, lineY);
            ctx.bezierCurveTo(
                padding + this.size * 0.3, lineY - 2,
                padding + this.size * 0.7, lineY + 2,
                padding + this.size - 3, lineY
            );
            ctx.stroke();
        }

        // 中文数字对照表 一~九
        var chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        // 阿拉伯数字对照表 1~9
        var arabicNums = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

        // 画所有横线：0~9行全部完整绘制，楚河汉界上下边框自然完整
        ctx.strokeStyle = '#8b4513'; // 棕色线条
        ctx.lineWidth = 2; // 粗细均匀
        for (var j = 0; j < 10; j++) {
            ctx.beginPath();
            var y = padding + j * cellSize + cellSize / 2;
            ctx.moveTo(padding + cellSize / 2, y);
            ctx.lineTo(padding + 8.5 * cellSize, y);
            ctx.stroke();
        }

        // 竖线：
        // - 最左(i=0)和最右(i=8)的边线：整根连通，不可以断开
        // - 中间(i=1~7)的竖线：楚河汉界(y=4线~y=5线)断开，不穿过
        for (var i = 0; i < 9; i++) {
            var x = i * cellSize + cellSize / 2 + padding;
            // 所有线条粗细均匀
            ctx.lineWidth = 2;

            if (i === 0 || i === 8) {
                // 边线：整根连通，从上到下不可以断开
                ctx.beginPath();
                ctx.moveTo(x, padding + cellSize / 2);
                ctx.lineTo(x, padding + 9.5 * cellSize);
                ctx.stroke();
            } else {
                // 中间竖线：楚河汉界断开，不穿过
                // 上半段：从顶部画到楚河汉界上方就停止
                ctx.beginPath();
                ctx.moveTo(x, padding + cellSize / 2);
                ctx.lineTo(x, padding + 4 * cellSize + cellSize / 2);
                ctx.stroke();
                // 下半段：从楚河汉界下方开始画到底部
                ctx.beginPath();
                ctx.moveTo(x, padding + 5 * cellSize + cellSize / 2);
                ctx.lineTo(x, padding + 9.5 * cellSize);
                ctx.stroke();
            }
        }

        // 画坐标编号：和参考保持一致
        // 黑方（顶部）：从左往右 1-9 使用阿拉伯数字
        // 红方（底部）：从右往左 一-九 使用中文数字
        ctx.font = Math.round(cellSize * 0.35) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#b37226';
        for (var i = 0; i < 9; i++) {
            var x = padding + (i + 0.5) * cellSize;
            // 黑方（顶部）：阿拉伯数字 左→右 1-9
            ctx.fillText(arabicNums[i], x, padding * 0.6);
            // 红方（底部）：中文数字 右→左 一-九
            ctx.fillText(chineseNums[8 - i], x, padding + cellSize * 10 + padding * 0.6);
        }

        // 楚河汉界文字：精确居中在整个楚河汉区间（y=4线 ~ y=5线）
        ctx.font = Math.round(cellSize * 0.55) + 'px "KaiTi", "STKaiti", serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8b4513';
        var riverTopY = padding + 4 * cellSize + cellSize / 2;    // 楚河汉界上边缘（横线位置）
        var riverBottomY = padding + 5 * cellSize + cellSize / 2; // 楚河汉界下边缘（横线位置）
        var riverCenterY = (riverTopY + riverBottomY) / 2; // 精确计算中心点，保证上下居中
        ctx.fillText('楚 河', padding + 2.25 * cellSize, riverCenterY + cellSize/8);
        ctx.fillText('漢 界', padding + 6.75 * cellSize, riverCenterY + cellSize/8);

        // 画九宫斜线 - 同样使用棕色
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        // 黑方九宫
        ctx.beginPath();
        ctx.moveTo(padding + 3*cellSize+cellSize/2, padding + 0*cellSize+cellSize/2);
        ctx.lineTo(padding + 5*cellSize+cellSize/2, padding + 2*cellSize+cellSize/2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding + 5*cellSize+cellSize/2, padding + 0*cellSize+cellSize/2);
        ctx.lineTo(padding + 3*cellSize+cellSize/2, padding + 2*cellSize+cellSize/2);
        ctx.stroke();
        // 红方九宫
        ctx.beginPath();
        ctx.moveTo(padding + 3*cellSize+cellSize/2, padding + 7*cellSize+cellSize/2);
        ctx.lineTo(padding + 5*cellSize+cellSize/2, padding + 9*cellSize+cellSize/2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding + 5*cellSize+cellSize/2, padding + 7*cellSize+cellSize/2);
        ctx.lineTo(padding + 3*cellSize+cellSize/2, padding + 9*cellSize+cellSize/2);
        ctx.stroke();

        // 传统棋盘标记 - 兵/卒位和炮位的十字突出标记
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1.5;
        var markerSize = cellSize * 0.12;
        
        // 绘制标记的辅助函数 - 在交叉点四个角画小三角形
        function drawMarker(x, y) {
            var cx = padding + x * cellSize + cellSize / 2;
            var cy = padding + y * cellSize + cellSize / 2;
            
            // 最左边的位置(x=0)只画右边两个三角形，不画到棋盘外
            if (x > 0) {
                // 左上角三角形
                ctx.beginPath();
                ctx.moveTo(cx - markerSize * 2, cy - markerSize);
                ctx.lineTo(cx - markerSize, cy - markerSize);
                ctx.lineTo(cx - markerSize, cy - markerSize * 2);
                ctx.stroke();
                
                // 左下角三角形
                ctx.beginPath();
                ctx.moveTo(cx - markerSize * 2, cy + markerSize);
                ctx.lineTo(cx - markerSize, cy + markerSize);
                ctx.lineTo(cx - markerSize, cy + markerSize * 2);
                ctx.stroke();
            }
            
            // 最右边的位置(x=8)只画左边两个三角形，不画到棋盘外
            if (x < 8) {
                // 右上角三角形
                ctx.beginPath();
                ctx.moveTo(cx + markerSize * 2, cy - markerSize);
                ctx.lineTo(cx + markerSize, cy - markerSize);
                ctx.lineTo(cx + markerSize, cy - markerSize * 2);
                ctx.stroke();
                
                // 右下角三角形
                ctx.beginPath();
                ctx.moveTo(cx + markerSize * 2, cy + markerSize);
                ctx.lineTo(cx + markerSize, cy + markerSize);
                ctx.lineTo(cx + markerSize, cy + markerSize * 2);
                ctx.stroke();
            }
        }
        
        // 黑方卒位 (第4行，y=3)
        drawMarker(0, 3);
        drawMarker(2, 3);
        drawMarker(4, 3);
        drawMarker(6, 3);
        drawMarker(8, 3);
        
        // 黑方炮位 (第3行，y=2)
        drawMarker(1, 2);
        drawMarker(7, 2);
        
        // 红方兵位 (第7行，y=6)
        drawMarker(0, 6);
        drawMarker(2, 6);
        drawMarker(4, 6);
        drawMarker(6, 6);
        drawMarker(8, 6);
        
        // 红方炮位 (第8行，y=7)
        drawMarker(1, 7);
        drawMarker(7, 7);

        // 绘制移动动画轨迹线
        if (this.animating) {
            var fromP = this.coordToPixel(this.animating.fromX, this.animating.fromY);
            var toP = this.coordToPixel(this.animating.toX, this.animating.toY);
            
            // 移动轨迹线 - 虚线
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(fromP.x, fromP.y);
            ctx.lineTo(toP.x, toP.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 画棋子 - 真实质感棋子
        // 黑方棋子文字：单人旁/石字旁区分
        var pieceNames = ['将', '士', '象', '馬', '車', '砲', '卒'];
        var redPieceNames = ['帅', '仕', '相', '傌', '俥', '炮', '兵'];
        for (var x = 0; x < 9; x++) {
            for (var y = 0; y < 10; y++) {
                var piece = this.game.board.get(x, y);
                if (!piece) continue;
                
                // 如果是移动动画中的棋子，跳过原位置绘制（将在动画位置单独绘制）
                if (this.animating && x === this.animating.toX && y === this.animating.toY) {
                    continue;
                }
                
                var p = this.coordToPixel(x, y);

                // 棋子大小 - 选中时放大
                var isSelected = this.selected && this.selected.x === x && this.selected.y === y;
                var pieceRadius = isSelected ? cellSize * 0.45 : cellSize * 0.40;

                // 棋子外阴影 - 真实质感
                ctx.beginPath();
                ctx.arc(p.x + 3, p.y + 3, pieceRadius, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fill();

                // 棋子主体 - 真实质感渐变
                var gradient = ctx.createRadialGradient(
                    p.x - pieceRadius * 0.3, p.y - pieceRadius * 0.3, pieceRadius * 0.1,
                    p.x, p.y, pieceRadius
                );
                if (piece.color === COLOR.RED) {
                    gradient.addColorStop(0, '#ff8888');    // 顶部高光
                    gradient.addColorStop(0.3, '#dd4444');  // 主体亮部
                    gradient.addColorStop(0.7, '#bb2222');  // 主体暗部
                    gradient.addColorStop(1, '#880000');    // 底部阴影
                } else {
                    gradient.addColorStop(0, '#888888');    // 顶部高光
                    gradient.addColorStop(0.3, '#555555');  // 主体亮部
                    gradient.addColorStop(0.7, '#333333');  // 主体暗部
                    gradient.addColorStop(1, '#111111');    // 底部阴影
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, pieceRadius, 0, 2 * Math.PI);
                ctx.fillStyle = gradient;
                ctx.fill();

                // 棋子边框 - 木质质感
                ctx.beginPath();
                ctx.arc(p.x, p.y, pieceRadius, 0, 2 * Math.PI);
                ctx.strokeStyle = piece.color === COLOR.RED ? '#8b0000' : '#444444';
                ctx.lineWidth = 3;
                ctx.stroke();

                // 白色内圆圈（文字外的白色圆圈）
                ctx.beginPath();
                ctx.arc(p.x, p.y, pieceRadius * 0.85, 0, 2 * Math.PI);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 文字 - 使用楷体，缩小字体
                ctx.font = (cellSize * 0.44) + 'px "KaiTi", "STKaiti", serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff'; // 白色文字
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 2;
                if (piece.color === COLOR.RED) {
                    ctx.fillText(redPieceNames[piece.type], p.x, p.y);
                } else {
                    ctx.fillText(pieceNames[piece.type], p.x, p.y);
                }
                ctx.shadowBlur = 0;
            }
        }

        // 绘制正在移动动画中的棋子
        if (this.animating) {
            var anim = this.animating;
            // 使用 easeOutQuad 缓动函数使动画更自然
            var t = anim.progress;
            var easeProgress = t * (2 - t); // 减速效果
            
            var currentX = anim.fromX + (anim.toX - anim.fromX) * easeProgress;
            var currentY = anim.fromY + (anim.toY - anim.fromY) * easeProgress;
            
            var p = {};
            p.x = padding + currentX * cellSize + cellSize / 2;
            p.y = padding + currentY * cellSize + cellSize / 2;
            
            var piece = anim.piece;
            var pieceRadius = cellSize * 0.40;

            // 棋子外阴影 - 真实质感
            ctx.beginPath();
            ctx.arc(p.x + 3, p.y + 3, pieceRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();

            // 棋子主体 - 真实质感渐变
            var gradient = ctx.createRadialGradient(
                p.x - pieceRadius * 0.3, p.y - pieceRadius * 0.3, pieceRadius * 0.1,
                p.x, p.y, pieceRadius
            );
            if (piece.color === COLOR.RED) {
                gradient.addColorStop(0, '#ff8888');    // 顶部高光
                gradient.addColorStop(0.3, '#dd4444');  // 主体亮部
                gradient.addColorStop(0.7, '#bb2222');  // 主体暗部
                gradient.addColorStop(1, '#880000');    // 底部阴影
            } else {
                gradient.addColorStop(0, '#888888');    // 顶部高光
                gradient.addColorStop(0.3, '#555555');  // 主体亮部
                gradient.addColorStop(0.7, '#333333');  // 主体暗部
                gradient.addColorStop(1, '#111111');    // 底部阴影
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, pieceRadius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();

            // 棋子边框 - 木质质感
            ctx.beginPath();
            ctx.arc(p.x, p.y, pieceRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = piece.color === COLOR.RED ? '#8b0000' : '#444444';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 白色内圆圈（文字外的白色圆圈）
            ctx.beginPath();
            ctx.arc(p.x, p.y, pieceRadius * 0.85, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 文字
            ctx.font = (cellSize * 0.44) + 'px "KaiTi", "STKaiti", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 2;
            if (piece.color === COLOR.RED) {
                ctx.fillText(redPieceNames[piece.type], p.x, p.y);
            } else {
                ctx.fillText(pieceNames[piece.type], p.x, p.y);
            }
            ctx.shadowBlur = 0;
        }
    };

    Renderer.prototype.bindEvents = function() {
        this.canvas.addEventListener('click', (function(e) {
            var rect = this.canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var coord = this.pixelToCoord(x, y);
            if (!coord) return;

            var piece = this.game.board.get(coord.x, coord.y);
            if (this.selected) {
                // 如果已经选中，尝试走棋
                if (this.selected.x === coord.x && this.selected.y === coord.y) {
                    // 取消选中
                    this.selected = null;
                } else if (piece && piece.color === this.getCurrentTurn()) {
                    // 选了同色另一棋子
                    this.selected = coord;
                } else {
                    // 走棋 - 先检查有效性
                    var fromX = this.selected.x;
                    var fromY = this.selected.y;
                    // 检查坐标范围
                    if (fromX < 0 || fromX >= 9 || fromY < 0 || fromY >= 10) {
                        this.selected = null;
                        this.render();
                        return;
                    }
                    // 检查起始位置确实有棋子
                    var fromPiece = this.game.board.get(fromX, fromY);
                    if (!fromPiece) {
                        this.selected = null;
                        this.render();
                        return;
                    }
                    // 检查目标坐标范围
                    var toX = coord.x;
                    var toY = coord.y;
                    if (toX < 0 || toX >= 9 || toY < 0 || toY >= 10) {
                        this.selected = null;
                        this.render();
                        return;
                    }
                    // 先执行走棋，然后触发动画（棋盘状态已更新，棋子已在新位置）
                    var success = this.game.move(fromX, fromY, toX, toY);
                    if (success) {
                        // 触发移动动画，使用移动前的棋子信息
                        this.triggerMoveAnimation(fromX, fromY, toX, toY, fromPiece);
                        if (this.options.onUserMove) {
                            var moveStr = moveToString(fromX, fromY, toX, toY);
                            this.options.onUserMove(fromX, fromY, toX, toY, moveStr);
                        }
                    }
                    this.selected = null;
                }
            } else {
                if (piece && piece.color === this.getCurrentTurn()) {
                    this.selected = coord;
                }
            }
            this.render();
        }).bind(this));
    };

    Renderer.prototype.getCurrentTurn = function() {
        // 红方先走，用 currentMoveIndex 判断，回退后正确更新
        return this.game.currentMoveIndex % 2 === 0 ? COLOR.RED : COLOR.BLACK;
    };

    // 获取当前 FEN
    Game.prototype.getFEN = function() {
        // 生成 FEN 格式
        var fen = '';
        for (var y = 0; y < 10; y++) {
            var empty = 0;
            for (var x = 0; x < 9; x++) {
                var piece = this.board.get(x, y);
                if (!piece) {
                    empty++;
                } else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    var c = piece.color === COLOR.RED ? 'R' : 'B';
                    var p = ['K', 'A', 'E', 'H', 'R', 'C', 'P'][piece.type];
                    fen += (piece.color === COLOR.RED ? p.toUpperCase() : p.toLowerCase());
                }
            }
            if (empty > 0) fen += empty;
            if (y < 9) fen += '/';
        }
        var turn = this.history.length % 2 === 0 ? 'w' : 'b';
        fen += ' ' + turn + ' - - 0 ' + (this.history.length + 1);
        return fen;
    };

    // 将坐标转换为中文记谱
    function coordinateToChineseMove(move, isRed) {
        var pieceNames = {0: ['将', '帅'], 1: ['士', '仕'], 2: ['象', '相'], 3: ['马', '马'], 4: ['车', '车'], 5: ['炮', '炮'], 6: ['卒', '兵']};
        var chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        
        // 优先使用保存的棋子信息，兼容旧版 history
        var piece = move.piece;
        if (!piece) {
            // 旧版兼容：根据颜色和类型重建
            if (move.pieceType !== undefined && move.pieceColor !== undefined) {
                piece = { type: move.pieceType, color: move.pieceColor };
            } else {
                return move.moveStr;
            }
        }
        
        // 棋子名称
        var pieceChar = pieceNames[piece.type][isRed ? 1 : 0];
        
        // 起点列号：红方从右数（中文数字），黑方从左数（阿拉伯数字）
        var fromCol = isRed ? chineseNums[8 - move.fromX] : (move.fromX + 1).toString();
        
        // 计算动作：平、进、退
        var action = '';
        var toColOrStep = '';
        
        if (move.fromY === move.toY) {
            // 横向移动：平
            action = '平';
            // 终点列号
            toColOrStep = isRed ? chineseNums[8 - move.toX] : (move.toX + 1).toString();
        } else if ((isRed && move.toY < move.fromY) || (!isRed && move.toY > move.fromY)) {
            // 向前移动：进
            action = '进';
            var step = Math.abs(move.toY - move.fromY);
            // 规则区分：
            // - 兵(PAWN)：未过河只能前进，纵向走输出步数，横走输出列号；过河后前进输出步数，横走输出列号
            // - 马/象/士：走斜线，终点列号唯一，所以输出列号
            // - 将：一步，但在九宫中x不会变，也输出步数
            // - 车/炮：走多步，输出步数
            if (piece.type === PIECE.PAWN) {
                // 兵：纵向走输出步数，横走（平）已经在上面处理了
                toColOrStep = isRed ? chineseNums[step - 1] : step.toString();
            } else if (piece.type === PIECE.HORSE || piece.type === PIECE.ELEPHANT || piece.type === PIECE.ADVISOR) {
                // 马/象/士：输出列号
                toColOrStep = isRed ? chineseNums[8 - move.toX] : (move.toX + 1).toString();
            } else {
                // 将/车/炮：输出步数
                toColOrStep = isRed ? chineseNums[step - 1] : step.toString();
            }
        } else {
            // 向后移动：退
            action = '退';
            var step = Math.abs(move.toY - move.fromY);
            if (piece.type === PIECE.PAWN) {
                // 兵（一般不会后退）：纵向走输出步数
                toColOrStep = isRed ? chineseNums[step - 1] : step.toString();
            } else if (piece.type === PIECE.HORSE || piece.type === PIECE.ELEPHANT || piece.type === PIECE.ADVISOR) {
                // 马/象/士：输出列号
                toColOrStep = isRed ? chineseNums[8 - move.toX] : (move.toX + 1).toString();
            } else {
                // 将/车/炮：输出步数
                toColOrStep = isRed ? chineseNums[step - 1] : step.toString();
            }
        }
        
        return pieceChar + fromCol + action + toColOrStep;
    }

    // 获取当前 PGN（中文记谱格式）
    Game.prototype.getPGN = function(options) {
        options = options || {};
        var includeHeader = options.includeHeader !== false;
        var includeMoveNumbers = options.includeMoveNumbers !== false;
        var format = options.format || 'text'; // text | array | full
        
        // 生成 PGN 头部
        var header = '';
        if (includeHeader) {
            header = '[Event "中国象棋"]\n';
            header += '[Site "Node-RED"]\n';
            header += '[Date "' + new Date().toISOString().slice(0, 10) + '"]\n';
            header += '[FEN "' + this.getFEN().split(' ')[0] + '"]\n';
            header += '\n';
        }
        
        // 生成着法数组
        var moves = [];
        for (var i = 0; i < this.history.length; i++) {
            var isRed = i % 2 === 0;
            var chineseMove = coordinateToChineseMove(this.history[i], isRed);
            moves.push(chineseMove || this.history[i].moveStr);
        }
        
        if (format === 'array') {
            return moves;
        }
        
        if (format === 'full') {
            return {
                header: header,
                moves: moves,
                total: moves.length,
                pgn: header + moves.join(' ')
            };
        }
        
        // 文本格式（带回合号）
        var pgn = '';
        for (var i = 0; i < moves.length; i++) {
            if (includeMoveNumbers && i % 2 === 0) {
                pgn += (Math.floor(i / 2) + 1) + '. ';
            }
            pgn += moves[i] + ' ';
        }
        
        return header + pgn.trim();
    };

    // 公开API
    return {
        Board: Board,
        Game: Game,
        Renderer: Renderer,
        PIECE: PIECE,
        COLOR: COLOR,
        moveToString: moveToString,
        parseMoveStr: parseMoveStr,
        parsePGN: parsePGN,
        chineseMoveToCoordinate: chineseMoveToCoordinate,
        validateFEN: validateFEN,
        extractFEN: extractFEN,
        normalizeFENChar: normalizeFENChar,
        createGame: function(options) {
            return new Game(options);
        },
        createRenderer: function(game, container, options) {
            return new Renderer(game, container, options);
        }
    };

})();

// 支持 CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChineseChess;
}
