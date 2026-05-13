const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 550,
    resizable: false,
    autoHideMenuBar: true,
    title: '番茄钟',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
}

ipcMain.handle('set-title', (_event, title) => {
  if (mainWindow) mainWindow.setTitle(title);
});

ipcMain.handle('show-notification', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => app.quit());
