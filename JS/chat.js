// 全局变量定义
let ws = null;
let myName = "";
let currentContact = "";
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let contactRefreshInterval = null;  // 这里已经声明了

// DOM元素
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const myNameInput = document.getElementById('myName');
const loginBtn = document.getElementById('loginBtn');
const myNameDisplay = document.getElementById('myNameDisplay');
const myAvatar = document.getElementById('myAvatar');
const friendList = document.getElementById('friendList');
const chatLog = document.getElementById('chatLog');
const chatTitle = document.getElementById('chatTitle');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const fileBtn = document.getElementById('fileBtn');
const callBtn = document.getElementById('callBtn');
const fileInput = document.getElementById('fileInput');
const audioPlayer = document.getElementById('audioPlayer');

// 初始化
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('初始化应用...');
  
  // 登录按钮点击事件
  if (loginBtn) {
    console.log('绑定登录按钮事件');
    // 确保移除之前的事件监听器，避免重复绑定
    loginBtn.removeEventListener('click', login);
    loginBtn.addEventListener('click', login);
    
    // 回车键登录
    myNameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        login();
      }
    });
    
    // 添加调试信息
    console.log('登录按钮已绑定事件');
  } else {
    console.error('登录按钮未找到!', document.getElementById('loginBtn'));
  }
  
  // 发送消息按钮点击事件
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
  
  // 回车键发送消息
  if (msgInput) {
    msgInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  // 语音消息按钮点击事件
  if (voiceBtn) {
    voiceBtn.addEventListener('click', toggleVoiceRecording);
  }
  
  // 文件按钮点击事件
  if (fileBtn) {
    fileBtn.addEventListener('click', function() {
      fileInput.click();
    });
  }
  
  // 文件选择事件
  if (fileInput) {
    fileInput.addEventListener('change', sendFile);
  }
  
  // 语音通话按钮点击事件
  if (callBtn && window.startCall) {
    callBtn.addEventListener('click', window.startCall);
  }
  
  console.log('初始化完成');
}

// 登录函数
function login() {
  console.log('登录函数被调用');
  myName = myNameInput.value.trim();
  if (!myName) { 
    alert("请输入用户名"); 
    return; 
  }
  
  try {
    console.log('尝试连接到服务器...');
    // 修改为你的服务器公网地址
    ws = new WebSocket('ws://www.landtu.top:666');
    
    // 设置连接超时
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState !== 1) { // 如果连接未打开
        console.error('WebSocket连接超时');
        alert('连接服务器超时，请确保服务器已启动');
        ws.close();
      }
    }, 5000);
    
    ws.onopen = function() {
      console.log('WebSocket连接已打开');
      clearTimeout(connectionTimeout);
      
      // 发送登录消息
      ws.send(JSON.stringify({ type: 'login', name: myName }));
      
      // 显示主界面 - 使用直接的DOM操作确保界面切换
      document.getElementById('loginContainer').style.display = 'none';
      document.getElementById('appContainer').style.display = 'flex';
      
      // 设置用户信息
      myNameDisplay.textContent = myName;
      myAvatar.textContent = myName.charAt(0).toUpperCase();
      
      // 立即请求好友列表
      ws.send(JSON.stringify({ 
        type: 'getFriendList',
        from: myName
      }));
      
      // 开始定时刷新联系人列表
      startContactListRefresh();
    };
    
    // 添加消息处理函数
    ws.onmessage = function handleWsMessage(event) {
      console.log('收到消息:', event.data);
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'system') {
          // 处理系统消息
          console.log('系统消息:', data.message);
          // 可以在UI上显示系统消息
        } else if (data.type === 'text') {
          // 处理文本消息
          console.log('文本消息:', data);
          appendMessage(data.from, data.message, data.from === myName);
        } else if (data.type === 'friendList') {
          // 处理好友列表
          console.log('好友列表:', data.friends);
          updateFriendList(data.friends);
        } else if (data.type === 'file') {
          // 处理文件消息
          console.log('文件消息:', data);
          appendFileMessage(data.from, data.filename, data.fileUrl, data.from === myName);
        } else if (data.type === 'voice') {
          // 处理语音消息
          console.log('语音消息:', data);
          appendVoiceMessage(data.from, data.audioUrl, data.from === myName);
        } else if (data.type === 'callRequest' || 
                  data.type === 'callAccepted' || 
                  data.type === 'callRejected' || 
                  data.type === 'callEnded' || 
                  data.type === 'offer' || 
                  data.type === 'answer' || 
                  data.type === 'candidate') {
          // 处理通话相关消息
          console.log('通话相关消息:', data.type);
          if (window.handleCallMessage) {
            window.handleCallMessage(data);
          }
        }
      } catch (e) {
        console.error('解析消息出错:', e);
      }
    };
    
    ws.onclose = function(event) {
      console.log('WebSocket连接已关闭', event);
      if (event.code === 1006) {
        alert('连接异常关闭，请检查服务器是否正常运行');
      }
    };
    
    ws.onerror = function(error) {
      console.error('WebSocket错误:', error);
      alert('连接服务器失败，请确保服务器已启动');
      clearTimeout(connectionTimeout);
    };
  } catch (error) {
    console.error('创建WebSocket连接时出错:', error);
    alert('连接服务器失败: ' + error.message);
  }
}

// 删除这一行，因为上面已经声明过了
// let contactRefreshInterval = null;  

function startContactListRefresh() {
  // 每30秒触发一次服务器返回在线用户列表
  contactRefreshInterval = setInterval(() => {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ 
        type: 'text', 
        message: '___refresh_contacts___',
        from: myName,
        _isSystemRefresh: true
      }));
    }
  }, 30000);
}

function stopContactListRefresh() {
  if (contactRefreshInterval) {
    clearInterval(contactRefreshInterval);
    contactRefreshInterval = null;
  }
}

// 添加消息到聊天记录
function appendMessage(sender, message, isMe) {
  if (!chatLog) return;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = isMe ? 'message message-sent' : 'message message-received';
  
  const nameSpan = document.createElement('span');
  nameSpan.className = 'message-sender';
  nameSpan.textContent = sender;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = message;
  
  const timeSpan = document.createElement('span');
  timeSpan.className = 'message-time';
  timeSpan.textContent = new Date().toLocaleTimeString();
  
  msgDiv.appendChild(nameSpan);
  msgDiv.appendChild(contentDiv);
  msgDiv.appendChild(timeSpan);
  
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 添加文件消息到聊天记录
function appendFileMessage(sender, filename, fileUrl, isMe) {
  if (!chatLog) return;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = isMe ? 'message message-sent' : 'message message-received';
  
  const nameSpan = document.createElement('span');
  nameSpan.className = 'message-sender';
  nameSpan.textContent = sender;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content file-message';
  
  const fileLink = document.createElement('a');
  fileLink.href = `http://www.landtu.top:666${fileUrl}`;
  fileLink.target = '_blank';
  fileLink.textContent = `📎 ${filename}`;
  
  contentDiv.appendChild(fileLink);
  
  const timeSpan = document.createElement('span');
  timeSpan.className = 'message-time';
  timeSpan.textContent = new Date().toLocaleTimeString();
  
  msgDiv.appendChild(nameSpan);
  msgDiv.appendChild(contentDiv);
  msgDiv.appendChild(timeSpan);
  
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 添加语音消息到聊天记录
function appendVoiceMessage(sender, audioUrl, isMe) {
  if (!chatLog) return;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = isMe ? 'message message-sent' : 'message message-received';
  
  const nameSpan = document.createElement('span');
  nameSpan.className = 'message-sender';
  nameSpan.textContent = sender;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content voice-message';
  
  const audio = document.createElement('audio');
  audio.controls = true;
  audio.src = `http://www.landtu.top:666${audioUrl}`;
  
  contentDiv.appendChild(audio);
  
  const timeSpan = document.createElement('span');
  timeSpan.className = 'message-time';
  timeSpan.textContent = new Date().toLocaleTimeString();
  
  msgDiv.appendChild(nameSpan);
  msgDiv.appendChild(contentDiv);
  msgDiv.appendChild(timeSpan);
  
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 更新好友列表
function updateFriendList(friends) {
  if (!friendList) return;
  
  // 清空现有列表
  friendList.innerHTML = '';
  
  // 添加好友
  friends.forEach(friend => {
    const friendDiv = document.createElement('div');
    friendDiv.className = 'friend-item';
    friendDiv.dataset.username = friend;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = friend.charAt(0).toUpperCase();
    
    const name = document.createElement('div');
    name.className = 'friend-name';
    name.textContent = friend;
    
    friendDiv.appendChild(avatar);
    friendDiv.appendChild(name);
    
    // 点击好友切换聊天
    friendDiv.addEventListener('click', function() {
      currentContact = friend;
      chatTitle.textContent = `与 ${friend} 聊天中`;
      
      // 高亮当前选中的好友
      document.querySelectorAll('.friend-item').forEach(item => {
        item.classList.remove('active');
      });
      friendDiv.classList.add('active');
      
      // 清空聊天记录（或者加载历史记录）
      // chatLog.innerHTML = '';
    });
    
    friendList.appendChild(friendDiv);
  });
}

// 发送消息函数
function sendMessage() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert('未连接到服务器');
    return;
  }
  
  const message = msgInput.value.trim();
  if (!message) return;
  
  // 清空输入框
  msgInput.value = '';
  
  // 构建消息对象
  const msgObj = {
    type: 'text',
    from: myName,
    message: message
  };
  
  // 如果有选中的联系人，则是私聊
  if (currentContact) {
    msgObj.to = currentContact;
  }
  
  // 发送消息
  ws.send(JSON.stringify(msgObj));
  
  // 如果是私聊，在本地显示消息
  if (currentContact) {
    appendMessage(myName, message, true);
  }
}

// 发送文件函数
function sendFile() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert('未连接到服务器');
    return;
  }
  
  if (!currentContact) {
    alert('请先选择一个联系人');
    return;
  }
  
  const file = fileInput.files[0];
  if (!file) return;
  
  // 文件大小限制（10MB）
  if (file.size > 10 * 1024 * 1024) {
    alert('文件大小不能超过10MB');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    // 获取base64编码的文件数据
    const fileData = e.target.result.split(',')[1];
    
    // 构建文件消息
    const fileMsg = {
      type: 'file',
      from: myName,
      to: currentContact,
      filename: file.name,
      fileData: fileData
    };
    
    // 发送文件
    ws.send(JSON.stringify(fileMsg));
    
    // 清空文件输入
    fileInput.value = '';
  };
  
  // 以base64格式读取文件
  reader.readAsDataURL(file);
}

// 语音录制函数
function toggleVoiceRecording() {
  if (!currentContact) {
    alert('请先选择一个联系人');
    return;
  }
  
  if (isRecording) {
    // 停止录音
    stopRecording();
  } else {
    // 开始录音
    startRecording();
  }
}

// 开始录音
function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const reader = new FileReader();
        
        reader.onload = function(e) {
          // 获取base64编码的音频数据
          const audioData = e.target.result.split(',')[1];
          
          // 构建语音消息
          const voiceMsg = {
            type: 'voice',
            from: myName,
            to: currentContact,
            audioData: audioData
          };
          
          // 发送语音消息
          ws.send(JSON.stringify(voiceMsg));
        };
        
        // 以base64格式读取音频数据
        reader.readAsDataURL(audioBlob);
      });
      
      mediaRecorder.start();
      isRecording = true;
      voiceBtn.classList.add('recording');
      voiceBtn.textContent = '停止录音';
      
      // 10秒后自动停止录音
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 10000);
    })
    .catch(error => {
      console.error('获取麦克风失败:', error);
      alert('无法访问麦克风');
    });
}

// 停止录音
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    voiceBtn.classList.remove('recording');
    voiceBtn.textContent = '语音消息';
    
    // 关闭麦克风
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}