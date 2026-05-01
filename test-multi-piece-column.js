// 测试脚本：验证同列多棋子中文记谱解析功能
// 用法：在浏览器控制台执行，或通过 Node-RED 测试

console.log("=== 测试同列多棋子中文记谱解析 ===");

// 加载 ChineseChess
if (typeof ChineseChess === 'undefined') {
    console.log("请在 Node-RED 仪表盘页面的浏览器控制台中运行此脚本");
} else {
    // 创建一个测试游戏
    var game = ChineseChess.createGame();
    game.reset();
    
    console.log("初始局面 FEN:", game.getFEN());
    
    // ========== 测试 1: 标准格式（原有功能）==========
    console.log("\n=== 测试 1: 标准格式 ===");
    
    // 测试 "炮二平五"
    var result = ChineseChess.chineseMoveToCoordinate("炮二平五", game);
    console.log("炮二平五:", result ? `from(${result.fromX},${result.fromY}) → to(${result.toX},${result.toY})` : "解析失败");
    
    // ========== 测试 2: 创建双车同列局面 ==========
    console.log("\n=== 测试 2: 创建双车同列局面并测试 ===");
    
    // 创建一个自定义局面：双车同列
    // 清空棋盘
    for (var x = 0; x < 9; x++) {
        for (var y = 0; y < 10; y++) {
            game.board.set(x, y, null);
        }
    }
    
    // 在第 0 列（一路）放两个红车（y=7 和 y=9）
    // 注意：y=9 是最下方（红方底线），y=7 是 y=9 上方两格
    game.board.set(0, 7, {type: 3, color: 0}); // 红车
    game.board.set(0, 9, {type: 3, color: 0}); // 红车
    game.board.set(4, 9, {type: 0, color: 0}); // 红帅
    
    // 黑方棋子（用于回合交替）
    game.board.set(4, 0, {type: 0, color: 1}); // 黑将
    
    // 重置历史，确保是红方回合
    game.history = [];
    game.currentMoveIndex = 0;
    
    console.log("双车局面 FEN:", game.getFEN());
    
    // 测试 "前车平二" - 应该移动 y=7 的车（更靠前的车）
    result = ChineseChess.chineseMoveToCoordinate("前车平二", game);
    console.log("前车平二:", result ? `from(${result.fromX},${result.fromY}) → to(${result.toX},${result.toY})` : "解析失败");
    if (result) {
        console.log("  → 验证：应该移动 y=7 的车（前车），实际 fromY=" + result.fromY);
        console.log("  → 结果: " + (result.fromY === 7 ? "✓ 正确" : "✗ 错误"));
    }
    
    // 测试 "后车平二" - 应该移动 y=9 的车（更靠后的车）
    result = ChineseChess.chineseMoveToCoordinate("后车平二", game);
    console.log("后车平二:", result ? `from(${result.fromX},${result.fromY}) → to(${result.toX},${result.toY})` : "解析失败");
    if (result) {
        console.log("  → 验证：应该移动 y=9 的车（后车），实际 fromY=" + result.fromY);
        console.log("  → 结果: " + (result.fromY === 9 ? "✓ 正确" : "✗ 错误"));
    }
    
    // ========== 测试 3: 黑方双车同列 ==========
    console.log("\n=== 测试 3: 黑方双车同列 ===");
    
    // 切换到黑方回合
    game.currentMoveIndex = 1;
    
    // 在第 0 列（1路）放两个黑车（y=0 和 y=2）
    game.board.set(0, 0, null); // 清空
    game.board.set(0, 2, null); // 清空
    game.board.set(0, 0, {type: 3, color: 1}); // 黑车（最上方）
    game.board.set(0, 2, {type: 3, color: 1}); // 黑车（下方）
    
    console.log("黑方双车局面 FEN:", game.getFEN());
    
    // 测试 "前车1平2" - 应该移动 y=2 的车（更靠近红方的，更靠前）
    result = ChineseChess.chineseMoveToCoordinate("前车1平2", game);
    console.log("前车1平2:", result ? `from(${result.fromX},${result.fromY}) → to(${result.toX},${result.toY})` : "解析失败");
    if (result) {
        console.log("  → 验证：应该移动 y=2 的车（前车，更靠近红方），实际 fromY=" + result.fromY);
        console.log("  → 结果: " + (result.fromY === 2 ? "✓ 正确" : "✗ 错误"));
    }
    
    // 测试 "后车1平2" - 应该移动 y=0 的车（更靠后的车）
    result = ChineseChess.chineseMoveToCoordinate("后车1平2", game);
    console.log("后车1平2:", result ? `from(${result.fromX},${result.fromY}) → to(${result.toX},${result.toY})` : "解析失败");
    if (result) {
        console.log("  → 验证：应该移动 y=0 的车（后车，黑方底线），实际 fromY=" + result.fromY);
        console.log("  → 结果: " + (result.fromY === 0 ? "✓ 正确" : "✗ 错误"));
    }
    
    // ========== 测试 4: 多列多棋子，使用5字符格式 ==========
    console.log("\n=== 测试 4: 多列多棋子，5字符格式（前炮二平五） ===");
    
    // 重置到红方回合
    game.currentMoveIndex = 0;
    
    // 清空棋盘
    for (var x = 0; x < 9; x++) {
        for (var y = 0; y < 10; y++) {
            game.board.set(x, y, null);
        }
    }
    
    // 在第 7 列（二路）放两个红炮（y=7 和 y=9）
    game.board.set(7, 7, {type: 4, color: 0}); // 红炮
    game.board.set(7, 9, {type: 4, color: 0}); // 红炮
    // 在第 0 列（一路）放两个红车
    game.board.set(0, 7, {type: 3, color: 0}); // 红车
    game.board.set(0, 9, {type: 3, color: 0}); // 红车
    game.board.set(4, 9, {type: 0, color: 0}); // 红帅
    
    // 黑方棋子
    game.board.set(4, 0, {type: 0, color: 1}); // 黑将
    
    console.log("多列多棋子局面 FEN:", game.getFEN());
    
    // 测试4字符格式应该失败（因为多列都有同类型棋子）
    result = ChineseChess.chineseMoveToCoordinate("前炮平五", game);
    console.log("前炮平五（4字符，多列时应失败）:", result ? "解析成功" : "解析失败 ✓");
    
    // 测试5字符格式：前炮二平五 - 应该移动二路(y=7)的炮
    result = ChineseChess.chineseMoveToCoordinate("前炮二平五", game);
    console.log("前炮二平五（5字符，显式指定列）:", result ? `from(${result.fromX},${result.fromY}) → to(${result.toX},${result.toY})` : "解析失败");
    if (result) {
        console.log("  → 验证：应该从 x=7(二路), y=7(前炮) 移动到 x=4(五路), y=7");
        console.log("  → 结果: " + (result.fromX === 7 && result.fromY === 7 && result.toX === 4 && result.toY === 7 ? "✓ 正确" : "✗ 错误"));
    }
    
    // 测试5字符格式：后炮二平五 - 应该移动二路(y=9)的炮
    result = ChineseChess.chineseMoveToCoordinate("后炮二平五", game);
    console.log("后炮二平五（5字符，显式指定列）:", result ? `from(${result.fromX},${result.fromY}) → to(${result.toX},${result.toY})` : "解析失败");
    if (result) {
        console.log("  → 验证：应该从 x=7(二路), y=9(后炮) 移动到 x=4(五路), y=9");
        console.log("  → 结果: " + (result.fromX === 7 && result.fromY === 9 && result.toX === 4 && result.toY === 9 ? "✓ 正确" : "✗ 错误"));
    }
    
    // ========== 测试 5: 黑方5字符格式 ==========
    console.log("\n=== 测试 5: 黑方5字符格式（后炮8平5） ===");
    
    game.currentMoveIndex = 1; // 黑方回合
    
    // 在第 7 列（8路）放两个黑炮
    game.board.set(7, 0, {type: 4, color: 1}); // 黑炮（y=0，更靠上=后）
    game.board.set(7, 2, {type: 4, color: 1}); // 黑炮（y=2，更靠下=前）
    
    // 测试黑方5字符格式：后炮8平5
    result = ChineseChess.chineseMoveToCoordinate("后炮8平5", game);
    console.log("后炮8平5（黑方5字符）:", result ? `from(${result.fromX},${result.fromY}) → to(${result.toX},${result.toY})` : "解析失败");
    if (result) {
        console.log("  → 验证：后炮应该是 y=0(黑方底线)，从 x=7(8路) 移动到 x=4(5路)");
        console.log("  → 结果: " + (result.fromX === 7 && result.fromY === 0 ? "✓ 正确" : "✗ 错误"));
    }
    
    // 测试黑方5字符格式：前炮8平5
    result = ChineseChess.chineseMoveToCoordinate("前炮8平5", game);
    console.log("前炮8平5（黑方5字符）:", result ? `from(${result.fromX},${result.fromY}) → to(${result.toX},${result.toY})` : "解析失败");
    if (result) {
        console.log("  → 验证：前炮应该是 y=2(更靠下=更靠近红方)，从 x=7(8路) 移动到 x=4(5路)");
        console.log("  → 结果: " + (result.fromX === 7 && result.fromY === 2 ? "✓ 正确" : "✗ 错误"));
    }
    
    console.log("\n=== 所有测试完成 ===");
}