const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const Shortcut = require("electron-shortcut");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const AppConfig = require("./electron-helpers/app-config");
const KantarPort = require("./electron-helpers/kantar-port");
const FisPrinter = require("./electron-helpers/fis-printer");
const { ayarlarMenu } = require("./electron-helpers/ayarlar/ayarlarMenu");

let mainWindow;

function printToAngular(message) {
  mainWindow.webContents.send("print", message);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, "electron-helpers/preload.js"),
    },
    icon: path.join(__dirname, "assets/icon.ico"),
  });

  mainWindow.setMenu(null);
  mainWindow.setTitle("Rota Kantar v" + app.getVersion());
  mainWindow.maximize();

  Menu.setApplicationMenu(ayarlarMenu);

  new Shortcut("Ctrl+F12", (e) => mainWindow.webContents.openDevTools());

  if (process.argv.includes("serve"))
    mainWindow.loadURL("http://localhost:4200");
  else
    mainWindow.loadURL(`file://${__dirname}/out/rota-kantar/index.html`);

  //export after declare variables and methods
  module.exports = { mainWindow, printToAngular, app, dialog };

  AppConfig.initialize();
  KantarPort.start();

  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 4000);
}

app.allowRendererProcessReuse = false;
app.on("ready", createWindow);

app.on("window-all-closed", () => app.quit());

app.on("activate", () => mainWindow ?? onReady());

ipcMain.on("restart_update", () => autoUpdater.quitAndInstall());

ipcMain.on("onprint", FisPrinter.printFis);

ipcMain.on("kantarConfig", AppConfig.update);

autoUpdater.on("update-available", () => {
  mainWindow.webContents.send("update_available");
  printToAngular("update_available");
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Hız: " + progressObj.bytesPerSecond;
  log_message = log_message + " - İndirilen " + progressObj.percent + "%";
  mainWindow.webContents.send("download_progress", {
    text: log_message,
    data: progressObj,
  });
  printToAngular(log_message);
});

autoUpdater.on("update-downloaded", () => {
  printToAngular("update-downloaded");
  mainWindow.webContents.send("update_downloaded");
});

autoUpdater.on("error", (message) => printToAngular(message));
