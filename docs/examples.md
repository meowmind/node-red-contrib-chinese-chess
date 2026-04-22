# 示例棋谱

## 示例1：中炮对屏风马

```pgn
1. 炮二平五 马8进7
2. 马二进三 卒7进1
3. 车一平二 车9平8
4. 兵七进一 马2进3
5. 马八进七 象3进5
6. 车二进六 炮8平9
7. 车二平三 炮9退1
```

## 示例2：顺炮直车对横车

```pgn
1. 炮二平五 炮8平5
2. 马二进三 马8进7
3. 车一平二 车9进1
4. 车二进六 卒3进1
5. 炮八平六 马2进3
6. 马八进七 车9平4
```

## 示例3：仙人指路对卒底炮

```pgn
1. 兵七进一 炮2平3
2. 炮二平五 象3进5
3. 马二进三 卒3进1
4. 马八进九 卒3进1
5. 车一平二 卒3进1
6. 炮八进五
```

## Node-RED 流示例

可以用以下方式控制节点：

1. **加载棋谱**
```json
msg.payload = {
  "action": "load",
  "pgn": "1. 炮二平五 马8进7 2. 马二进三 卒7进1"
};
return msg;
```

2. **下一步**
```json
msg.payload = { "action": "next" };
return msg;
```

3. **上一步**
```json
msg.payload = { "action": "prev" };
return msg;
```

4. **跳转到第 N 步**
```json
msg.payload = { "action": "goto", "step": 5 };
return msg;
```

5. **重置**
```json
msg.payload = { "action": "reset" };
return msg;
```
