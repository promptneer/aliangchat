// 导入electron模块
const { app, BrowserWindow } = require('electron');
const path = require('path');

// 保持对window对象的全局引用
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      devTools: true
    }
  });

  // 使用简单版本的聊天应用直接替代electron
  mainWindow.loadFile('simple-chat.html');

  // 打开开发者工具进行调试
  mainWindow.webContents.openDevTools();

  // 当window被关闭时，触发下面的事件
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

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