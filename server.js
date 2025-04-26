// server.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
// 删除这一行 ↓↓↓
// const net = require('net');

const app = express();
const PORT = 666;

// 静态文件服务，用于提供上传的文件下载
app.use('/files', express.static(path.join(__dirname, 'files')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server }, () => {
  console.log(`Signaling server is running on port ${PORT}`);
});

let clients = new Map(); // username => ws
const filesDir = path.join(__dirname, 'files');
let activeVoiceCalls = new Map(); // 存储活跃的语音通话 {user1_user2: {caller: user1, receiver: user2}}

// 确保文件存储目录存在
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

function broadcast(msgObj) {
  const msg = JSON.stringify(msgObj);
  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

function sendTo(target, msgObj) {
  const ws = clients.get(target);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msgObj));
  }
}

wss.on('connection', (ws) => {
  console.log('新客户端连接');
  let userName = null;

  ws.on('message', (message) => {
    console.log('收到消息:', message.toString().substring(0, 100) + (message.toString().length > 100 ? '...' : ''));
    let data;
    try { 
      data = JSON.parse(message); 
      console.log('解析后类型:', data.type);
    } catch (e) { 
      console.error('消息解析错误:', e);
      return; 
    }

    if (data.type === 'login') {
      userName = data.name;
      clients.set(userName, ws);
      console.log(`用户 ${userName} 登录成功, 当前在线:`, Array.from(clients.keys()));
      
      // 发送登录成功确认给当前用户
      ws.send(JSON.stringify({ 
        type: 'system', 
        message: `登录成功, 当前在线: ${Array.from(clients.keys()).join(', ')}` 
      }));
      
      // 向所有在线用户广播用户列表更新
      broadcast({
        type: 'system',
        message: `用户列表更新, 当前在线: ${Array.from(clients.keys()).join(', ')}`
      });
    } else if (data.type === 'text') {
      console.log(`文字消息: ${data.from || userName} 说: ${data.message}`);
      // 如果指定了接收者，只发给接收者，否则群发
      if (data.to) {
        sendTo(data.to, {
          type: 'text',
          from: data.from || userName,
          to: data.to,
          message: data.message
        });
        // 同时发送给自己，用于多设备同步
        if (data.from !== userName) {
          sendTo(data.from || userName, {
            type: 'text',
            from: data.from || userName,
            to: data.to,
            message: data.message
          });
        }
      } else {
        // 文字消息群发
        broadcast({
          type: 'text',
          from: data.from || userName,
          message: data.message
        });
      }
    } else if (data.type === 'voice') {
      console.log(`语音消息: 从 ${data.from} 到 ${data.to}`);
      // 语音消息只转发给目标用户
      if (data.to) {
        sendTo(data.to, data);
      }
    } else if (data.type === 'file') {
      console.log(`文件消息: 从 ${data.from} 到 ${data.to}, 文件名: ${data.filename}`);
      
      // 如果是文件传输请求
      if (data.fileData) {
        // 保存文件到服务器
        const filename = `${Date.now()}_${data.filename}`;
        const filePath = path.join(filesDir, filename);
        
        // 将base64数据转换为文件
        const fileData = Buffer.from(data.fileData, 'base64');
        fs.writeFileSync(filePath, fileData);
        
        console.log(`文件已保存到服务器: ${filePath}`);
        
        // 转发文件消息给目标用户
        if (data.to) {
          sendTo(data.to, {
            type: 'file',
            from: data.from,
            to: data.to,
            filename: data.filename,
            fileSize: fileData.length,
            fileUrl: `/files/${filename}`
          });
        }
      }
    } else if (
      data.type === 'offer' ||
      data.type === 'answer' ||
      data.type === 'candidate'
    ) {
      console.log(`信令消息: ${data.type}, 从 ${data.from} 到 ${data.to}`);
      // 只转发给目标用户
      if (data.to) sendTo(data.to, data);
    } else if (data.type === 'callRequest') {
      // 处理通话请求
      console.log(`通话请求: 从 ${data.from} 到 ${data.to}`);
      
      // 记录通话状态
      const callId = `${data.from}_${data.to}`;
      activeVoiceCalls.set(callId, {
        caller: data.from,
        receiver: data.to,
        status: 'requesting'
      });
      
      // 转发通话请求给接收者
      sendTo(data.to, {
        type: 'callRequest',
        from: data.from,
        to: data.to
      });
    } else if (data.type === 'callResponse') {
      // 处理通话响应（接受/拒绝）
      console.log(`通话响应: 从 ${data.from} 到 ${data.to}, 接受: ${data.accept}`);
      
      const callId1 = `${data.to}_${data.from}`;
      const callId2 = `${data.from}_${data.to}`;
      const callInfo = activeVoiceCalls.get(callId1) || activeVoiceCalls.get(callId2);
      
      if (callInfo) {
        if (data.accept) {
          // 更新通话状态
          callInfo.status = 'accepted';
          
          // 通知发起者通话已被接受
          sendTo(data.to, {
            type: 'callAccepted',
            from: data.from,
            to: data.to
          });
        } else {
          // 通知发起者通话被拒绝
          sendTo(data.to, {
            type: 'callRejected',
            from: data.from,
            to: data.to,
            reason: data.reason || '对方拒绝了通话'
          });
          
          // 删除通话记录
          activeVoiceCalls.delete(callId1);
          activeVoiceCalls.delete(callId2);
        }
      }
    } else if (data.type === 'endCall') {
      // 处理结束通话请求
      console.log(`结束通话: 从 ${data.from} 到 ${data.to}`);
      
      const callId1 = `${data.from}_${data.to}`;
      const callId2 = `${data.to}_${data.from}`;
      
      // 通知对方通话已结束
      sendTo(data.to, {
        type: 'callEnded',
        from: data.from,
        to: data.to,
        reason: data.reason || '对方结束了通话'
      });
      
      // 删除通话记录
      activeVoiceCalls.delete(callId1);
      activeVoiceCalls.delete(callId2);
    } else if (data.type === 'getFriendList') {
      // 发送好友列表给请求用户
      ws.send(JSON.stringify({
        type: 'friendList',
        friends: Array.from(clients.keys()).filter(name => name !== userName)
      }));
    }
  });

  ws.on('close', () => {
    console.log(`客户端断开: ${userName}`);
    if (userName && clients.get(userName) === ws) {
      clients.delete(userName);
      
      // 检查是否有未结束的通话，通知对方
      for (const [callId, callInfo] of activeVoiceCalls.entries()) {
        if (callInfo.caller === userName || callInfo.receiver === userName) {
          const otherUser = callInfo.caller === userName ? callInfo.receiver : callInfo.caller;
          
          // 通知对方通话已结束
          sendTo(otherUser, {
            type: 'callEnded',
            from: userName,
            to: otherUser,
            reason: '对方已断开连接'
          });
          
          // 删除通话记录
          activeVoiceCalls.delete(callId);
        }
      }
      
      // 向所有在线用户广播用户列表更新
      broadcast({
        type: 'system',
        message: `用户列表更新, 当前在线: ${Array.from(clients.keys()).join(', ')}`
      });
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket错误:', err);
  });
});

// 启动HTTP服务器
server.listen(PORT, () => {
  console.log(`HTTP服务器运行在端口 ${PORT}`);
  console.log(`WebSocket服务器地址: ws://localhost:${PORT}`);
  console.log(`文件服务地址: http://localhost:${PORT}/files`);
  console.log(`健康检查地址: http://localhost:${PORT}/ping`);
});

// 添加ping端点用于检测服务器是否在线
app.get('/ping', (req, res) => {
  console.log('收到ping请求');
  res.status(200).send('pong');
});

// 添加错误处理
server.on('error', (err) => {
  console.error('服务器错误:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请尝试使用其他端口或关闭占用该端口的程序`);
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// ======= 删除以下内容 =======
// const net = require('net');
// const PORT = 666;

// const tester = net.createServer()
//   .once('error', function (err) {
//     if (err.code === 'EADDRINUSE') {
//       console.error(`端口 ${PORT} 已被占用，服务器无法启动。`);
//       process.exit(1);
//     }
//   })
//   .once('listening', function () {
//     tester.close();
//     // ...原有服务器启动代码...
//   })
//   .listen(PORT);
// ======= 删除结束 =======
