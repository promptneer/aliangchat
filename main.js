const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// 移除不需要的服务器启动相关代码
// const { spawn } = require('child_process');
// const net = require('net');
// let serverProcess = null;

// 保持对window对象的全局引用
let mainWindow;

// 移除检查端口和启动服务器的函数
// function isPortInUse(port) {...}
// async function startServer() {...}

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    }
  });

  // 加载应用的主页面
  mainWindow.loadFile('chat.html');

  // 打开开发者工具进行调试
  mainWindow.webContents.openDevTools();

  // 添加页面加载完成事件
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成');
    // 执行一些调试代码
    mainWindow.webContents.executeJavaScript(
      'console.log("DOM元素检查:");' +
      'console.log("登录按钮:", document.getElementById("loginBtn"));' +
      'console.log("用户名输入框:", document.getElementById("myName"));' +
      
      '// 检查主要容器元素\n' +
      'console.log("登录容器:", document.getElementById("loginContainer"));' +
      'console.log("应用容器:", document.getElementById("appContainer"));' +
      'console.log("侧边栏:", document.querySelector(".sidebar"));' +
      'console.log("聊天容器:", document.querySelector(".chat-container"));' +
      
      '// 添加HTML结构检查\n' +
      'console.log("HTML结构检查:");' +
      'console.log("body内容:", document.body.innerHTML);' +
      
      '// 直接在这里绑定登录按钮事件\n' +
      'document.getElementById("loginBtn").onclick = function() {' +
      '  console.log("登录按钮被点击");' +
      '  const myName = document.getElementById("myName").value.trim();' +
      '  if (!myName) { ' +
      '    alert("请输入用户名"); ' +
      '    return; ' +
      '  }' +
      
      '  try {' +
      '    console.log("尝试连接到服务器...");' +
      '    const ws = new WebSocket("ws://www.landtu.top:666");' +
      
      '    ws.onopen = function() {' +
      '      console.log("WebSocket连接已打开");' +
      
      '      // 发送登录消息\n' +
      '      ws.send(JSON.stringify({ type: "login", name: myName }));' +
      
      '      // 显示主界面 - 使用更明确的样式设置\n' +
      '      const loginContainer = document.getElementById("loginContainer");' +
      '      const appContainer = document.getElementById("appContainer");' +
      
      '      if (loginContainer) {' +
      '        loginContainer.style.display = "none";' +
      '        console.log("已隐藏登录容器");' +
      '      } else {' +
      '        console.error("找不到登录容器元素");' +
      '      }' +
      
      '      if (appContainer) {' +
      '        // 重建应用界面结构\n' +
      '        // 不使用模板字符串，而是使用DOM API创建元素\n' +
      '        if (appContainer) {' +
      '        // 清空容器\n' +
      '        appContainer.innerHTML = "";' +
      
      '        // 创建侧边栏\n' +
      '        const sidebar = document.createElement("div");' +
      '        sidebar.className = "sidebar";' +
      '        sidebar.style.display = "flex";' +
      '        sidebar.style.flexDirection = "column";' +
      '        sidebar.style.width = "250px";' +
      '        sidebar.style.background = "#2c2c2c";' +
      '        sidebar.style.color = "#f0f0f0";' +
      
      '        // 创建用户信息区域\n' +
      '        const userInfo = document.createElement("div");' +
      '        userInfo.className = "user-info";' +
      
      '        const myAvatar = document.createElement("div");' +
      '        myAvatar.id = "myAvatar";' +
      '        myAvatar.className = "avatar";' +
      
      '        const myNameDisplay = document.createElement("div");' +
      '        myNameDisplay.id = "myNameDisplay";' +
      '        myNameDisplay.className = "name";' +
      
      '        userInfo.appendChild(myAvatar);' +
      '        userInfo.appendChild(myNameDisplay);' +
      
      '        // 创建联系人列表\n' +
      '        const contactList = document.createElement("div");' +
      '        contactList.id = "contactList";' +
      '        contactList.className = "contact-list";' +
      
      '        sidebar.appendChild(userInfo);' +
      '        sidebar.appendChild(contactList);' +
      
      '        // 创建聊天容器\n' +
      '        const chatContainer = document.createElement("div");' +
      '        chatContainer.className = "chat-container";' +
      '        chatContainer.style.display = "flex";' +
      '        chatContainer.style.flexDirection = "column";' +
      '        chatContainer.style.flex = "1";' +
      '        chatContainer.style.background = "#333";' +
      
      '        // 创建聊天头部\n' +
      '        const chatHeader = document.createElement("div");' +
      '        chatHeader.className = "chat-header";' +
      
      '        const contactInfo = document.createElement("div");' +
      '        contactInfo.className = "contact-info";' +
      
      '        const contactAvatar = document.createElement("div");' +
      '        contactAvatar.id = "contactAvatar";' +
      '        contactAvatar.className = "avatar";' +
      
      '        const contactName = document.createElement("div");' +
      '        contactName.id = "contactName";' +
      '        contactName.className = "name";' +
      '        contactName.textContent = "选择一个联系人开始聊天";' +
      
      '        contactInfo.appendChild(contactAvatar);' +
      '        contactInfo.appendChild(contactName);' +
      
      '        const actions = document.createElement("div");' +
      '        actions.className = "actions";' +
      
      '        const callBtn = document.createElement("button");' +
      '        callBtn.id = "callBtn";' +
      '        callBtn.className = "action-btn";' +
      '        callBtn.textContent = "通话";' +
      
      '        actions.appendChild(callBtn);' +
      
      '        chatHeader.appendChild(contactInfo);' +
      '        chatHeader.appendChild(actions);' +
      
      '        // 创建消息区域\n' +
      '        const messages = document.createElement("div");' +
      '        messages.id = "messages";' +
      '        messages.className = "messages";' +
      
      '        // 创建输入区域\n' +
      '        const inputArea = document.createElement("div");' +
      '        inputArea.className = "input-area";' +
      
      '        const messageInput = document.createElement("input");' +
      '        messageInput.id = "messageInput";' +
      '        messageInput.type = "text";' +
      '        messageInput.placeholder = "输入消息...";' +
      
      '        const sendBtn = document.createElement("button");' +
      '        sendBtn.id = "sendBtn";' +
      '        sendBtn.textContent = "发送";' +
      
      '        inputArea.appendChild(messageInput);' +
      '        inputArea.appendChild(sendBtn);' +
      
      '        // 组装聊天容器\n' +
      '        chatContainer.appendChild(chatHeader);' +
      '        chatContainer.appendChild(messages);' +
      '        chatContainer.appendChild(inputArea);' +
      
      '        // 将侧边栏和聊天容器添加到应用容器\n' +
      '        appContainer.appendChild(sidebar);' +
      '        appContainer.appendChild(chatContainer);' +
      
      '        // 设置应用容器样式\n' +
      '        appContainer.style.display = "flex";' +
      '        appContainer.style.width = "100%";' +
      '        appContainer.style.height = "100vh";' +
      '        appContainer.style.visibility = "visible";' +
      '        appContainer.style.opacity = "1";' +
      '        appContainer.style.zIndex = "1";' +
      
      '        console.log("已重建并显示应用容器");' +
      
      '        // 重新绑定发送消息按钮事件\n' +
      '        const sendBtn = document.getElementById("sendBtn");' +
      '        const messageInput = document.getElementById("messageInput");' +
      
      '        if (sendBtn && messageInput) {' +
      '          sendBtn.onclick = function() {' +
      '            const message = messageInput.value.trim();' +
      '            if (message && window.chatApp.currentContact) {' +
      '              ws.send(JSON.stringify({' +
      '                type: "text",' +
      '                from: myName,' +
      '                to: window.chatApp.currentContact,' +
      '                message: message' +
      '              }));' +
      
      '              // 添加消息到聊天界面\n' +
      '              const messagesContainer = document.getElementById("messages");' +
      '              const messageElement = document.createElement("div");' +
      '              messageElement.className = "message sent";' +
      '              messageElement.innerHTML = ' +
      '                "<div class=\"message-content\">" + message + "</div>" +' +
      '                "<div class=\"message-time\">" + new Date().toLocaleTimeString() + "</div>";' +
      '              messagesContainer.appendChild(messageElement);' +
      '              messagesContainer.scrollTop = messagesContainer.scrollHeight;' +
      
      '              // 清空输入框\n' +
      '              messageInput.value = "";' +
      '            }' +
      '          };' +
      
      '          // 添加回车键发送功能\n' +
      '          messageInput.onkeypress = function(e) {' +
      '            if (e.key === "Enter") {' +
      '              sendBtn.click();' +
      '            }' +
      '          };' +
      
      '          console.log("已重新绑定发送消息事件");' +
      '        }' +
      '      } else {' +
      '        console.error("找不到应用容器元素");' +
      '      }' +
      
      '      // 设置用户信息\n' +
      '      const myNameDisplay = document.getElementById("myNameDisplay");' +
      '      const myAvatar = document.getElementById("myAvatar");' +
      
      '      if (myNameDisplay) {' +
      '        myNameDisplay.textContent = myName;' +
      '        console.log("已设置用户名显示");' +
      '      } else {' +
      '        console.error("找不到用户名显示元素");' +
      '      }' +
      
      '      if (myAvatar) {' +
      '        myAvatar.textContent = myName.charAt(0).toUpperCase();' +
      '        console.log("已设置用户头像");' +
      '      } else {' +
      '        console.error("找不到用户头像元素");' +
      '      }' +
      
      '      // 立即请求好友列表\n' +
      '      ws.send(JSON.stringify({' +
      '        type: "getFriendList",' +
      '        from: myName' +
      '      }));' +
      
      '      // 将ws对象设置为全局变量，以便其他脚本可以访问\n' +
      '      window.chatApp = {' +
      '        ws: ws,' +
      '        myName: myName,' +
      '        currentContact: "",' +
      '        // 添加处理好友列表的方法\n' +
      '        updateFriendList: function(friends) {' +
      '          const contactList = document.getElementById("contactList");' +
      '          if (contactList) {' +
      '            contactList.innerHTML = "";' +
      '            friends.forEach(friend => {' +
      '              const contactElement = document.createElement("div");' +
      '              contactElement.className = "contact";' +
      '              contactElement.innerHTML = ' +
      '                "<div class=\"avatar\">" + friend.charAt(0).toUpperCase() + "</div>" +' +
      '                "<div class=\"name\">" + friend + "</div>";' +
      '              contactElement.onclick = function() {' +
      '                window.chatApp.currentContact = friend;' +
      '                document.getElementById("contactName").textContent = friend;' +
      '                document.getElementById("contactAvatar").textContent = friend.charAt(0).toUpperCase();' +
      '                document.querySelectorAll(".contact").forEach(el => el.classList.remove("active"));' +
      '                contactElement.classList.add("active");' +
      '                document.getElementById("messages").innerHTML = "";' +
      '              };' +
      '              contactList.appendChild(contactElement);' +
      '            });' +
      '            console.log("已更新好友列表");' +
      '          }' +
      '        }' +
      '      };' +
      
      '      // 创建缺失的语音通话元素\n' +
      '      ensureVoiceCallElements();' +
      
      '      // 处理消息接收\n' +
      '      ws.onmessage = function(event) {' +
      '        console.log("收到消息:", event.data);' +
      '        try {' +
      '          const data = JSON.parse(event.data);' +
      '          console.log("解析的消息:", data);' +
      
      '          // 处理好友列表\n' +
      '          if (data.type === "friendList" && data.friends) {' +
      '            window.chatApp.updateFriendList(data.friends);' +
      '          }' +
      
      '          // 处理文本消息\n' +
      '          if (data.type === "text" && data.from && data.message) {' +
      '            // 如果是当前联系人发来的消息，显示在聊天界面\n' +
      '            if (data.from === window.chatApp.currentContact) {' +
      '              const messagesContainer = document.getElementById("messages");' +
      '              const messageElement = document.createElement("div");' +
      '              messageElement.className = "message received";' +
      '              messageElement.innerHTML = ' +
      '                "<div class=\"message-content\">" + data.message + "</div>" +' +
      '                "<div class=\"message-time\">" + new Date().toLocaleTimeString() + "</div>";' +
      '              messagesContainer.appendChild(messageElement);' +
      '              messagesContainer.scrollTop = messagesContainer.scrollHeight;' +
      '            }' +
      '          }' +
      '        } catch (e) {' +
      '          console.error("解析消息出错:", e);' +
      '        }' +
      '      };' +
      '    }' +
      
      '    ws.onclose = function(event) {' +
      '      console.log("WebSocket连接已关闭", event);' +
      '      if (event.code === 1006) {' +
      '        alert("连接异常关闭，请检查服务器是否正常运行");' +
      '      }' +
      '    };' +
      
      '    ws.onerror = function(error) {' +
      '      console.error("WebSocket错误:", error);' +
      '      alert("连接服务器失败，请确保服务器已启动");' +
      '    };' +
      '  } catch (error) {' +
      '    console.error("创建WebSocket连接时出错:", error);' +
      '    alert("连接服务器失败: " + error.message);' +
      '  }' +
      '};' +
      
      '// 确保语音通话所需的DOM元素存在\n' +
      'function ensureVoiceCallElements() {' +
      '  console.log("确保语音通话元素存在");' +
      
      '  // 检查并创建缺失的元素\n' +
      '  if (!document.getElementById("callEndBtn")) {' +
      '    const callEndBtn = document.createElement("button");' +
      '    callEndBtn.id = "callEndBtn";' +
      '    callEndBtn.className = "call-btn red";' +
      '    callEndBtn.innerHTML = "<i class=\"fas fa-phone-slash\"></i>";' +
      '    document.body.appendChild(callEndBtn);' +
      '    console.log("已创建callEndBtn元素");' +
      '  }' +
      
      '  if (!document.getElementById("callAcceptBtn")) {' +
      '    const callAcceptBtn = document.createElement("button");' +
      '    callAcceptBtn.id = "callAcceptBtn";' +
      '    callAcceptBtn.className = "call-btn green";' +
      '    callAcceptBtn.innerHTML = "<i class=\"fas fa-phone\"></i>";' +
      '    document.body.appendChild(callAcceptBtn);' +
      '    console.log("已创建callAcceptBtn元素");' +
      '  }' +
      
      '  if (!document.getElementById("callMuteBtn")) {' +
      '    const callMuteBtn = document.createElement("button");' +
      '    callMuteBtn.id = "callMuteBtn";' +
      '    callMuteBtn.className = "call-btn blue";' +
      '    callMuteBtn.innerHTML = "<i class=\"fas fa-microphone\"></i>";' +
      '    document.body.appendChild(callMuteBtn);' +
      '    console.log("已创建callMuteBtn元素");' +
      '  }' +
      
      '  if (!document.getElementById("notificationAcceptBtn")) {' +
      '    const notificationAcceptBtn = document.createElement("button");' +
      '    notificationAcceptBtn.id = "notificationAcceptBtn";' +
      '    notificationAcceptBtn.className = "notification-btn accept";' +
      '    notificationAcceptBtn.textContent = "接受";' +
      '    document.body.appendChild(notificationAcceptBtn);' +
      '    console.log("已创建notificationAcceptBtn元素");' +
      '  }' +
      
      '  if (!document.getElementById("notificationRejectBtn")) {' +
      '    const notificationRejectBtn = document.createElement("button");' +
      '    notificationRejectBtn.id = "notificationRejectBtn";' +
      '    notificationRejectBtn.className = "notification-btn reject";' +
      '    notificationRejectBtn.textContent = "拒绝";' +
      '    document.body.appendChild(notificationRejectBtn);' +
      '    console.log("已创建notificationRejectBtn元素");' +
      '  }' +
      
      '  if (!document.getElementById("volumeSlider")) {' +
      '    const volumeSlider = document.createElement("input");' +
      '    volumeSlider.id = "volumeSlider";' +
      '    volumeSlider.type = "range";' +
      '    volumeSlider.min = "0";' +
      '    volumeSlider.max = "100";' +
      '    volumeSlider.value = "80";' +
      '    document.body.appendChild(volumeSlider);' +
      '    console.log("已创建volumeSlider元素");' +
      '  }' +
      
      '  // 延迟初始化语音通话功能\n' +
      '  setTimeout(() => {' +
      '    if (window.initVoiceCallAfterLogin) {' +
      '      console.log("调用语音通话初始化函数");' +
      '      window.initVoiceCallAfterLogin();' +
      '    } else {' +
      '      console.error("语音通话初始化函数未找到");' +
      '    }' +
      '  }, 1000);' +
      '}' +
      
      'console.log("登录按钮事件已直接绑定");'
    );
  });
  
  // 当window被关闭时，触发下面的事件
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  // 直接创建窗口，不尝试启动服务器
  createWindow();
});

// 当所有窗口都被关闭时退出，除了在macOS上
app.on('window-all-closed', function() {
  // 在macOS上，除非用户用Cmd + Q确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (mainWindow === null) createWindow();
}); 