// 测试中文记谱前缀功能
var fs = require('fs');
var path = require('path');

// 加载核心文件
var coreCode = fs.readFileSync(path.join(__dirname, 'resources/chinese-chess-core.js'), 'utf8');
eval(coreCode);

var game = ChineseChess.createGame();
console.log('初始局面 FEN:', game.getFEN());

// 1. 红方: 炮二进二 (把红炮抬高，让两个炮同列)
// 左边红炮 (1,7) -> (1,5)
console.log('\n=== 1. 抬左炮 ===');
game.move(1, 7, 1, 5);
var pgn = game.getPGN({ includeHeader: false });
console.log('PGN:', pgn);

// 2. 现在 (1,5) 和 (7,7) 是两个炮，把右炮也走到第一列
// 右边红炮 (7,7) -> (1,4)
console.log('\n=== 2. 右炮也移动到第1列（同列多炮） ===');
game.move(7, 7, 1, 4);
pgn = game.getPGN({ includeHeader: false });
console.log('PGN:', pgn);

// 现在第一列有两个红炮，分别在 y=4 和 y=5
// 让我们把其中一个走一步
console.log('\n=== 3. 走前面的炮（y=4，应该是前炮） ===');
game.move(1, 4, 4, 4);
pgn = game.getPGN({ includeHeader: false });
console.log('PGN:', pgn);

// 检查最后一步
var lastMove = game.history[game.history.length - 1];
console.log('最后一步 moveObj:', JSON.stringify({
    fromX: lastMove.fromX,
    fromY: lastMove.fromY,
    toX: lastMove.toX,
    toY: lastMove.toY,
    positionPrefix: lastMove.positionPrefix,
    pieceType: lastMove.pieceType
}, null, 2));

console.log('\n✅ 测试完成');
