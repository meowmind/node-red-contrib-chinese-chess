/**
 * PGN 加载功能测试脚本
 * 验证修复后的棋子移动问题
 */

// 引入核心库
var ChineseChess = require('./resources/chinese-chess-core.js');

// 创建游戏实例
var game = ChineseChess.createGame();

console.log('=== PGN 加载功能测试 ===\n');

// 测试1：基础 PGN 加载
var testPGN = '1. 炮二平五 马8进7 2. 马二进三 车9平8';
console.log('测试 PGN: ' + testPGN);
console.log('');

var result = game.loadPGN(testPGN);

console.log('加载结果:');
console.log('  success:', result.success);
console.log('  total:', result.total);
console.log('  loaded:', result.loaded);
console.log('  errors:', result.errors);
console.log('');

if (result.success) {
    console.log('✓ PGN 加载成功!');
    console.log('');
    console.log('最终局面 FEN:');
    console.log('  ' + game.getFEN());
    console.log('');
    
    // 验证每一步的走法
    console.log('验证每步着法:');
    for (var i = 0; i < game.history.length; i++) {
        var move = game.history[i];
        var isRed = i % 2 === 0;
        console.log('  第' + (i+1) + '步 (' + (isRed ? '红' : '黑') + '): (' + move.fromX + ',' + move.fromY + ') -> (' + move.toX + ',' + move.toY + ')');
    }
} else {
    console.log('✗ PGN 加载失败!');
}

console.log('');
console.log('=== 单独验证每步坐标解析 ===\n');

// 重置游戏，逐个测试每步解析
var game2 = ChineseChess.createGame();
var moves = ['炮二平五', '马8进7', '马二进三', '车9平8'];

for (var i = 0; i < moves.length; i++) {
    var moveText = moves[i];
    var expectedIsRed = i % 2 === 0;
    
    console.log('第' + (i+1) + '步: ' + moveText + ' (' + (expectedIsRed ? '红方' : '黑方') + ')');
    
    var coord = ChineseChess.chineseMoveToCoordinate(moveText, game2);
    if (coord) {
        console.log('  解析结果: (' + coord.fromX + ',' + coord.fromY + ') -> (' + coord.toX + ',' + coord.toY + ')');
        
        // 验证走法
        var piece = game2.board.get(coord.fromX, coord.fromY);
        if (piece) {
            console.log('  起点棋子: 类型=' + piece.type + ', 颜色=' + (piece.color === 0 ? '红' : '黑'));
            
            var isValid = game2.board.isValidMove(coord.fromX, coord.fromY, coord.toX, coord.toY);
            console.log('  规则验证: ' + (isValid ? '✓ 合法' : '✗ 非法'));
            
            if (isValid) {
                game2.move(coord.fromX, coord.fromY, coord.toX, coord.toY);
                console.log('  执行走棋成功');
            }
        } else {
            console.log('  ✗ 起点无棋子');
        }
    } else {
        console.log('  ✗ 坐标解析失败');
    }
    console.log('');
}

console.log('最终局面 FEN:');
console.log('  ' + game2.getFEN());

console.log('\n=== 测试完成 ===');
