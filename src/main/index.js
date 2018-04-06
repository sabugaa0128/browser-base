const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { platform } = require('os');
const wpm = require('wexond-package-manager');
const ipcMessages = require('../shared/defaults/ipc-messages');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    frame: process.env.NODE_ENV === 'dev',
    minWidth: 300,
    minHeight: 430,
    width: 900,
    height: 700,
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.resolve(__dirname, 'preloads/index.js'),
      plugins: true,
    },
  });

  if (process.env.NODE_ENV === 'dev') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.setMenu(null);
  }

  mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.loadURL(path.join('file://', __dirname, '../../static/pages/app.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('fullscreen', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('fullscreen', false);
  });
};

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (platform() !== 'darwin') {
    app.quit();
  }
});

ipcMain.on(ipcMessages.PLUGIN_INSTALL, (event, arg) => {
  wpm.default.install(arg);
});
