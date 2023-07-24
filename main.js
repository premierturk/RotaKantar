const { app, BrowserWindow, ipcMain } = require("electron");
const { SerialPort } = require("serialport");
const path = require("path");
const Shortcut = require("electron-shortcut");
var args = process.argv;
const kantarName = "Kantar_1"; //Configürasyonlardan hangi kantar seçilecekse ismi

const config = require("./kantarConfigs.json")[kantarName];

function createWindow() {
  let mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.setMenu(null);
  new Shortcut("Ctrl+F12", function (e) {
    mainWindow.webContents.openDevTools();
  });
  //Serialport
  if (true) {
    const port = new SerialPort(config.SerialPort);

    port.open(function (err) {
      if (err) {
        return console.log("Error opening port: ", err.message);
      }
    });
    port.on("error", function (err) {
      console.log("Error: ", err.message);
    });

    var allMessage = "";
    port.on("data", function (data) {
      allMessage += new Buffer.from(data).toString();
      if (allMessage.endsWith("\\n")) {
        allMessage = allMessage.replace("\\n", "");
        console.log("Data:", allMessage);
        mainWindow.webContents.send("kantar", [allMessage]);
        allMessage = "";
      }
    });
  }
  mainWindow.maximize();

  if (args.includes("serve")) {
    mainWindow.loadURL("http://localhost:4200");
  } else {
    mainWindow.loadFile("dist/ronesans-kantar/index.html");
  }
}

function replaceAll(find, replace, str) {
  while (str.indexOf(find) > -1) {
    str = str.replace(find, replace);
  }
  return str;
}
app.on("ready", createWindow);
app.allowRendererProcessReuse = false;
app.on("window-all-closed", function () {
  app.quit();
});
app.on("activate", function () {
  if (mainWindow === null) createWindow();
});

ipcMain.on("restart", async (event, data) => {
  app.exit();
  app.relaunch();
});

ipcMain.on("onprint", async (event, data) => {});
