/**
 * PGN 分步走棋功能测试
 * 验证：加载 PGN 后缓存着法，通过 next/prev 分步执行
 */

var ChineseChess = require('./resources/chinese-chess-core.js');

console.log('=== PGN 分步走棋功能测试 ===\n');

// 创建游戏实例
var game = ChineseChess.createGame();

// 测试 PGN
var testPGN = '1. 炮二平五 马8进7 2. 马二进三 车9平8';
console.log('测试 PGN: ' + testPGN);
console.log('');

// 1. 加载 PGN
console.log('--- 步骤1: 加载 PGN ---');
var result = game.loadPGN(testPGN);
console.log('加载结果:');
console.log('  success:', result.success);
console.log('  total:', result.total);
console.log('  loaded:', result.loaded);
console.log('');
console.log('game.pgnMoves:', game.pgnMoves);
console.log('game.pgnCurrentStep:', game.pgnCurrentStep);
console.log('game.history.length:', game.history.length);
console.log('');

// 2. 点击下一步四次
console.log('--- 步骤2: 点击下一步 4 次 ---');
for (var i = 1; i <= 4; i++) {
    console.log('第' + i + '次 next:');
    var nextResult = game.next();
    console.log('  success:', nextResult);
    console.log('  pgnCurrentStep:', game.pgnCurrentStep);
    console.log('  history.length:', game.history.length);
    if (game.history.length > 0) {
        var lastMove = game.history[game.history.length - 1];
        console.log('  最后一步: (' + lastMove.fromX + ',' + lastMove.fromY + ') -> (' + lastMove.toX + ',' + lastMove.toY + ')');
    }
    console.log('  FEN:', game.getFEN().split(' ')[0]);
    console.log('');
}

// 3. 点击上一步两次
console.log('--- 步骤3: 点击上一步 2 次 ---');
for (var i = 1; i <= 2; i++) {
    console.log('第' + i + '次 back:');
    var backResult = game.back();
    console.log('  success:', backResult);
    console.log('  pgnCurrentStep:', game.pgnCurrentStep);
    console.log('  history.length:', game.history.length);
    console.log('  FEN:', game.getFEN().split(' ')[0]);
    console.log('');
}

// 4. 再点击下一步
console.log('--- 步骤4: 再点击下一步 1 次 ---');
var nextResult = game.next();
console.log('  success:', nextResult);
console.log('  pgnCurrentStep:', game.pgnCurrentStep);
console.log('  history.length:', game.history.length);
console.log('  FEN:', game.getFEN().split(' ')[0]);
console.log('');

console.log('=== 测试完成 ===');
