// 语音通话相关变量
let localStream = null;
let peerConnection = null;
let incomingCall = false;
let currentCallContact = "";
let callTimer = null;
let callStartTime = null;
let isMuted = false;
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// 不要立即初始化，而是等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM已加载，但不立即初始化语音通话功能');
});

// 创建一个全局函数，在登录成功后调用
window.initVoiceCallAfterLogin = function() {
  console.log('登录成功后初始化语音通话功能');
  setTimeout(initVoiceCall, 1000); // 延迟1秒，确保DOM已完全渲染
};

function initVoiceCall() {
  console.log('开始初始化语音通话功能');
  
  // 获取DOM元素
  const remoteAudio = document.getElementById('remoteAudio');
  const callContainer = document.getElementById('callContainer');
  const callAvatar = document.getElementById('callAvatar');
  const callName = document.getElementById('callName');
  const callStatus = document.getElementById('callStatus');
  const callTimerDisplay = document.getElementById('callTimer');
  const volumeSlider = document.getElementById('volumeSlider');
  const callMuteBtn = document.getElementById('callMuteBtn');
  const callEndBtn = document.getElementById('callEndBtn');
  const callAcceptBtn = document.getElementById('callAcceptBtn');
  const callRingtone = document.getElementById('callRingtone');
  const callNotification = document.getElementById('callNotification');
  const callNotificationAvatar = document.getElementById('callNotificationAvatar');
  const callNotificationName = document.getElementById('callNotificationName');
  const notificationAcceptBtn = document.getElementById('notificationAcceptBtn');
  const notificationRejectBtn = document.getElementById('notificationRejectBtn');
  
  console.log('DOM元素检查:');
  console.log('callContainer:', callContainer);
  console.log('callEndBtn:', callEndBtn);
  console.log('callAcceptBtn:', callAcceptBtn);
  console.log('notificationAcceptBtn:', notificationAcceptBtn);
  console.log('notificationRejectBtn:', notificationRejectBtn);
  console.log('volumeSlider:', volumeSlider);
  
  // 添加空检查，避免null引用错误
  if (callEndBtn) {
    callEndBtn.addEventListener('click', endCall);
    console.log('已绑定callEndBtn事件');
  } else {
    console.error('callEndBtn 元素未找到');
  }
  
  if (callAcceptBtn) {
    callAcceptBtn.addEventListener('click', acceptCall);
    console.log('已绑定callAcceptBtn事件');
  } else {
    console.error('callAcceptBtn 元素未找到');
  }
  
  if (callMuteBtn) {
    callMuteBtn.addEventListener('click', toggleMute);
    console.log('已绑定callMuteBtn事件');
  } else {
    console.error('callMuteBtn 元素未找到');
  }
  
  if (notificationAcceptBtn) {
    notificationAcceptBtn.addEventListener('click', acceptCallFromNotification);
    console.log('已绑定notificationAcceptBtn事件');
  } else {
    console.error('notificationAcceptBtn 元素未找到');
  }
  
  if (notificationRejectBtn) {
    notificationRejectBtn.addEventListener('click', rejectCall);
    console.log('已绑定notificationRejectBtn事件');
  } else {
    console.error('notificationRejectBtn 元素未找到');
  }
  
  // 音量滑块事件
  if (volumeSlider) {
    volumeSlider.addEventListener('input', function() {
      if (remoteAudio) {
        remoteAudio.volume = this.value / 100;
      }
    });
    console.log('已绑定volumeSlider事件');
  } else {
    console.error('volumeSlider 元素未找到');
  }
  
  console.log('语音通话功能初始化完成');
}

// 处理通话相关消息
window.handleCallMessage = function(data) {
  if (data.to !== window.chatApp.myName) return;
  
  if (data.type === 'offer') {
    handleOffer(data);
  } else if (data.type === 'answer') {
    handleAnswer(data);
  } else if (data.type === 'candidate') {
    handleCandidate(data);
  } else if (data.type === 'callRequest') {
    handleCallRequest(data.from);
  } else if (data.type === 'callAccepted') {
    handleCallAccepted(data.from);
  } else if (data.type === 'callRejected') {
    handleCallRejected(data.from, data.reason);
  } else if (data.type === 'callEnded') {
    handleCallEnded(data.from, data.reason);
  }
};

// 开始语音通话
window.startCall = function() {
  if (!window.chatApp.currentContact) {
    alert('请先选择一个联系人');
    return;
  }
  
  currentCallContact = window.chatApp.currentContact;
  
  // 发送通话请求
  window.chatApp.ws.send(JSON.stringify({
    type: 'callRequest',
    from: window.chatApp.myName,
    to: currentCallContact
  }));
  
  // 显示通话界面
  showCallUI(currentCallContact, false);
  callRingtone.play();
};

// 处理通话请求
function handleCallRequest(caller) {
  incomingCall = true;
  currentCallContact = caller;
  
  // 显示通话通知
  callNotificationAvatar.textContent = caller.charAt(0).toUpperCase();
  callNotificationName.textContent = caller;
  callNotification.classList.remove('hidden');
  
  // 播放铃声
  callRingtone.play();
}

// 接受通话
function acceptCall() {
  callAcceptBtn.classList.add('hidden');
  callRingtone.pause();
  callRingtone.currentTime = 0;
  
  // 发送接受通话响应
  window.chatApp.ws.send(JSON.stringify({
    type: 'callResponse',
    from: window.chatApp.myName,
    to: currentCallContact,
    accept: true
  }));
  
  // 创建WebRTC连接
  createPeerConnection();
  
  // 获取本地音频流
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      localStream = stream;
      
      // 将本地流添加到连接中
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      callStatus.textContent = '通话已连接';
      startCallTimer();
    })
    .catch(err => {
      console.error('获取麦克风失败:', err);
      alert('无法获取麦克风权限: ' + err.message);
      endCall();
    });
}

// 从通知接受通话
function acceptCallFromNotification() {
  callNotification.classList.add('hidden');
  showCallUI(currentCallContact, true);
  acceptCall();
}

// 拒绝通话
function rejectCall() {
  callNotification.classList.add('hidden');
  callRingtone.pause();
  callRingtone.currentTime = 0;
  
  // 发送拒绝通话响应
  window.chatApp.ws.send(JSON.stringify({
    type: 'callResponse',
    from: window.chatApp.myName,
    to: currentCallContact,
    accept: false,
    reason: '对方拒绝了通话'
  }));
  
  incomingCall = false;
  currentCallContact = '';
}

// 处理通话接受
function handleCallAccepted(from) {
  callRingtone.pause();
  callRingtone.currentTime = 0;
  
  // 创建WebRTC连接
  createPeerConnection();
  
  // 获取本地音频流
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      localStream = stream;
      
      // 将本地流添加到连接中
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      // 创建并发送offer
      peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
          window.chatApp.ws.send(JSON.stringify({
            type: 'offer',
            from: window.chatApp.myName,
            to: currentCallContact,
            sdp: peerConnection.localDescription
          }));
        })
        .catch(err => {
          console.error('创建offer失败:', err);
          endCall();
        });
      
      callStatus.textContent = '通话已连接';
      startCallTimer();
    })
    .catch(err => {
      console.error('获取麦克风失败:', err);
      alert('无法获取麦克风权限: ' + err.message);
      endCall();
    });
}

// 处理通话拒绝
function handleCallRejected(from, reason) {
  callRingtone.pause();
  callRingtone.currentTime = 0;
  callStatus.textContent = reason || '对方拒绝了通话';
  
  // 3秒后关闭通话界面
  setTimeout(() => {
    callContainer.classList.add('hidden');
    currentCallContact = '';
  }, 3000);
}

// 结束通话
function endCall() {
  if (currentCallContact) {
    // 发送结束通话请求
    window.chatApp.ws.send(JSON.stringify({
      type: 'endCall',
      from: window.chatApp.myName,
      to: currentCallContact
    }));
  }
  
  cleanupCall();
}

// 处理通话结束
function handleCallEnded(from, reason) {
  callStatus.textContent = reason || '通话已结束';
  
  // 3秒后关闭通话界面
  setTimeout(() => {
    cleanupCall();
  }, 3000);
}

// 清理通话资源
function cleanupCall() {
  // 停止计时器
  if (callTimer) {
    clearInterval(callTimer);
    callTimer = null;
  }
  
  // 关闭本地流
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  // 关闭WebRTC连接
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  // 停止铃声
  callRingtone.pause();
  callRingtone.currentTime = 0;
  
  // 隐藏通话界面
  callContainer.classList.add('hidden');
  callNotification.classList.add('hidden');
  
  // 重置变量
  currentCallContact = '';
  incomingCall = false;
  isMuted = false;
  callMuteBtn.textContent = '🔇';
  callMuteBtn.classList.remove('active');
  callTimerDisplay.textContent = '00:00';
}

// 显示通话界面
function showCallUI(contact, isIncoming) {
  callContainer.classList.remove('hidden');
  callAvatar.textContent = contact.charAt(0).toUpperCase();
  callName.textContent = contact;
  
  if (isIncoming) {
    callStatus.textContent = '来电...';
    callAcceptBtn.classList.remove('hidden');
  } else {
    callStatus.textContent = '正在呼叫...';
    callAcceptBtn.classList.add('hidden');
  }
}

// 创建WebRTC连接
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(rtcConfig);
  
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      window.chatApp.ws.send(JSON.stringify({
        type: 'candidate',
        from: window.chatApp.myName,
        to: currentCallContact,
        candidate: event.candidate
      }));
    }
  };
  
  peerConnection.ontrack = event => {
    remoteAudio.srcObject = event.streams[0];
  };
  
  peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE连接状态:', peerConnection.iceConnectionState);
    if (peerConnection.iceConnectionState === 'disconnected' || 
        peerConnection.iceConnectionState === 'failed' || 
        peerConnection.iceConnectionState === 'closed') {
      callStatus.textContent = '连接已断开';
      setTimeout(() => {
        cleanupCall();
      }, 3000);
    }
  };
}

// 处理WebRTC Offer
function handleOffer(data) {
  if (!incomingCall) {
    incomingCall = true;
    currentCallContact = data.from;
    showCallUI(data.from, true);
    callRingtone.play();
  }
  
  if (peerConnection) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
      .then(() => {
        if (localStream) {
          return peerConnection.createAnswer();
        }
      })
      .then(answer => {
        if (answer) {
          return peerConnection.setLocalDescription(answer);
        }
      })
      .then(() => {
        if (peerConnection.localDescription) {
          window.chatApp.ws.send(JSON.stringify({
            type: 'answer',
            from: window.chatApp.myName,
            to: currentCallContact,
            sdp: peerConnection.localDescription
          }));
        }
      })
      .catch(err => {
        console.error('处理offer失败:', err);
      });
  }
}

// 处理WebRTC Answer
function handleAnswer(data) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
    .catch(err => {
      console.error('处理answer失败:', err);
    });
}

// 处理WebRTC ICE Candidate
function handleCandidate(data) {
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
      .catch(err => {
        console.error('添加ice candidate失败:', err);
      });
  }
}

// 开始通话计时器
function startCallTimer() {
  callStartTime = new Date();
  callTimer = setInterval(() => {
    const now = new Date();
    const diff = now - callStartTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    callTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// 麦克风静音切换
function toggleMute() {
  if (!localStream) return;
  
  isMuted = !isMuted;
  
  localStream.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });
  
  if (isMuted) {
    callMuteBtn.textContent = '🔊';
    callMuteBtn.classList.add('active');
    callStatus.textContent = '已静音';
  } else {
    callMuteBtn.textContent = '🔇';
    callMuteBtn.classList.remove('active');
    callStatus.textContent = '通话中';
  }
}