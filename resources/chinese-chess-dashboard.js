/* Node-RED Dashboard Chinese Chess Widget */
(function() {
    'use strict';

    angular.module('node-red-dashboard')
        .directive('ngChineseChess', ['$window', '$timeout', function($window, $timeout) {
            return {
                restrict: 'E',
                scope: { ctrl: '=' },
                template: '<div id=\"chess-container-{{ctrl.id}}\" style=\"text-align: center;\"></div>',
                link: function(scope, element) {
                    var ctrl = scope.ctrl;
                    var container = element.find('div');
                    var game = null;
                    var renderer = null;
                    var infoPanel = null;

                    // 加载核心脚本
                    if (!window.ChineseChess) {
                        var script = document.createElement('script');
                        script.src = RED.httpAdmin.baseUrl + 'chinese-chess/chinese-chess-core.js';
                        script.onload = init;
                        document.head.appendChild(script);
                    } else {
                        init();
                    }

                    function init() {
                        // 创建容器
                        container.append('<div id=\"chess-container\"></div>');
                        container.append('<div id=\"info-panel\" style=\"margin-top: 10px; padding: 8px; background: #f5f5f5; border-radius: 4px; min-height: 20px;\"></div>');
                        var chessContainer = document.getElementById('chess-container');
                        infoPanel = document.getElementById('info-panel');

                        var config = ctrl.control.config;
                        var width = config.width || 400;
                        var height = config.height || 400;

                        // 初始化游戏
                        game = ChineseChess.createGame({
                            onEvent: function(event, data) {
                                if (event === 'move' || event === 'back' || event === 'reset' || event === 'goto') {
                                    // 发送事件到 Node-RED 后端
                                    ctrl.send({
                                        payload: {
                                            fen: game.getFEN(),
                                            pgn: game.getPGN(),
                                            currentStep: game.history.length,
                                            totalSteps: game.history.length,
                                            turn: game.history.length % 2 === 0 ? 'red' : 'black',
                                            history: game.history
                                        }
                                    });
                                    updateInfo();
                                }
                            }
                        });

                        renderer = ChineseChess.createRenderer(game, chessContainer, {
                            size: width,
                            showControls: config.showControls !== false,
                            onUserMove: function(fromX, fromY, toX, toY, moveStr) {
                                var success = game.move(fromX, fromY, toX, toY);
                                if (success) {
                                    if (game.script) {
                                        var branch = game.matchBranch(moveStr);
                                        if (branch) {
                                            showBranches();
                                            if (branch.next) {
                                                game.currentNode = getNodeById(game.script, branch.next);
                                            }
                                            updateInfo(branch.note);
                                        } else {
                                            updateInfo('Branch not matched: ' + moveStr);
                                        }
                                    }
                                    renderer.render();
                                }
                            }
                        });

                        game.reset();
                        renderer.render();
                        updateInfo();

                        // 监听来自后端的消息
                        scope.$on('ngRedDashboard:msg', function(event, msg) {
                            if (msg.payload && msg.payload.action) {
                                handleMessage(msg.payload);
                            } else if (msg.action) {
                                handleMessage(msg);
                            }
                        });

                        function handleMessage(data) {
                            switch (data.action) {
                                case 'load':
                                    if (data.pgn) {
                                        var result = game.loadPGN(data.pgn);
                                        if (result.success) {
                                            updateInfo('PGN loaded: ' + result.loaded + '/' + result.total + ' moves valid');
                                            if (renderer) renderer.render();
                                        } else {
                                            var errorMsg = '❌ PGN validation failed: ' + result.errors.length + ' errors';
                                            if (result.errors.length > 0) {
                                                errorMsg += '<br>&bull; ' + result.errors.slice(0, 3).join('<br>&bull; ');
                                                if (result.errors.length > 3) errorMsg += '<br>&bull; ...and ' + (result.errors.length - 3) + ' more errors';
                                            }
                                            updateInfo(errorMsg);
                                        }
                                    } else if (data.script) {
                                        game.script = data.script;
                                        game.reset();
                                        updateInfo('Script loaded');
                                    }
                                    break;

                                case 'next':
                                    game.next();
                                    break;

                                case 'prev':
                                    game.back();
                                    break;

                                case 'goto':
                                    if (typeof data.step === 'number') {
                                        game.goto(data.step);
                                    }
                                    break;

                                case 'move':
                                    if (data.from && data.to) {
                                        game.move(
                                            parseInt(data.from[0], 10),
                                            parseInt(data.from[1], 10),
                                            parseInt(data.to[0], 10),
                                            parseInt(data.to[1], 10)
                                        );
                                    }
                                    break;

                                case 'reset':
                                    game.reset();
                                    break;
                            }
                            if (renderer) {
                                renderer.render();
                            }
                        }

                        function getNodeById(script, id) {
                            if (!script || !script.nodes) return null;
                            return script.nodes.find(function(n) { return n.id === id; });
                        }

                        function updateInfo(text) {
                            if (text && infoPanel) {
                                infoPanel.innerHTML = '<strong>Info:</strong> ' + text;
                            } else if (infoPanel && game) {
                                infoPanel.innerHTML = '<strong>Step:</strong> ' + game.history.length + ', <strong>Turn:</strong> ' + (game.history.length % 2 === 0 ? 'Red' : 'Black');
                            }
                        }

                        function showBranches() {
                            if (!game.currentNode || !game.currentNode.branches || !infoPanel) return;
                            var html = '<div><strong>可选分支:</strong></div>';
                            game.currentNode.branches.forEach(function(b) {
                                var cls = 'branch branch-' + (b.type || 'main');
                                var style = 'display: inline-block; margin: 2px; padding: 4px 8px; border-radius: 4px; cursor: pointer; ';
                                if (b.type === 'main') style += 'background: #a6e22e;';
                                else if (b.type === 'soft') style += 'background: #fd971f;';
                                else if (b.type === 'trap') style += 'background: #f92672;';
                                else style += 'background: #ae81ff;';
                                html += '<span class=\"' + cls + '\" style=\"' + style + '\" data-move=\"' + b.move + '\">' + (b.label || b.type) + ': ' + (b.note || '') + '</span>';
                            });
                            infoPanel.innerHTML = html;
                            // 绑定点击事件
                            infoPanel.querySelectorAll('.branch').forEach(function(el) {
                                el.addEventListener('click', function() {
                                    var moveStr = el.getAttribute('data-move');
                                    var m = ChineseChess.parseMoveStr(moveStr);
                                    if (m) {
                                        game.move(m.fromX, m.fromY, m.toX, m.toY);
                                        if (renderer) renderer.render();
                                    }
                                });
                            });
                        }
                    }
                }
            };
        }]);
})();
