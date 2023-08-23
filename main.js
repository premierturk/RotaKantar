const { app, BrowserWindow, ipcMain } = require("electron");
const { SerialPort } = require("serialport");
const path = require("path");
const ptp = require("pdf-to-printer");
const Shortcut = require("electron-shortcut");
const fs = require('fs');
//const { autoUpdater } = require("electron-updater");
var args = process.argv;

var resourcesRoot = fs.existsSync("./kantarConfigs.json") ? "./" : "./resources/";

const jsonFile = JSON.parse(fs.readFileSync(resourcesRoot + 'kantarConfigs.json'));
const kantarName = JSON.parse(fs.readFileSync("C:\\RotaKantarName.json")).kantarName;
if (kantarName == "" || kantarName == undefined) {
  throw new Error("(RotaKantarName.json) KANTAR ADI BULUNAMADI!");
}
const config = jsonFile[kantarName];


if (config == undefined) {
  throw new Error("KANTAR KONFİGÜRASYONU BULUNAMADI!");
}
let mainWindow;
async function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets/icon.ico")
  });
  mainWindow.setMenu(null);
  mainWindow.setTitle("Rota Kantar v" + app.getVersion());

  new Shortcut("Ctrl+F12", function (e) {
    mainWindow.webContents.openDevTools();
  });
  // new Shortcut("Ctrl+F5", function (e) {
  //   mainWindow.reload();
  // });
  //Serialport
  if (config.kantar) {
    const port = new SerialPort(config.serialPort);

    port.open(function (err) {
      if (err) {
        return console.log("Error opening port: ", err.message);
      }
    });

    port.on("error", function (err) {
      console.log("Error: ", err.message);
    });

    var currMessage = "";
    var messages = [];
    port.on("data", function (data) {

      mainWindow.webContents.send("print", data);

      currMessage = Buffer.from(data).toString();

      mainWindow.webContents.send("print", "String Data =>" + currMessage);


      var s = currMessage;

      s = s.replace("\r", "");
      s = s.replace("\\r", "");
      s = s.replace("A", "");
      s = s.replace("B", "");
      s = s.replace("C", "");
      s = s.replace("D", "");
      s = s.replace("J", "");
      s = s.replaceAll(" ", "");

      if (s.includes("@")) {
        s = s.replace("@", "");

        var r = parseInt(s);
        messages.push(r);

        if (messages.length == 5) {
          let allSame = [...new Set(messages)].length == 1;

          if (allSame) {
            mainWindow.webContents.send("kantar", [messages[0]]);
            console.log("Data sended => " + messages[0]);
            messages = [];
          } else {
            messages = messages.slice(1);
          }
        }

      }


      // if (currMessage.endsWith('\\r') && currMessage.startsWith("@")) {

      //   currMessage = currMessage.replaceAll("\\r", "");
      //   currMessage = currMessage.replaceAll("@", "");
      //   currMessage = currMessage.replaceAll(" ", "");
      //   mainWindow.webContents.send("print", "Parsed => " + currMessage);

      //   messages.push(currMessage);

      //   if (messages.length == 5) {
      //     let allSame = [...new Set(messages)].length == 1;

      //     if (allSame) {
      //       mainWindow.webContents.send("kantar", [messages[0]]);
      //       console.log("Data sended => " + messages[0]);
      //       messages = [];
      //     } else {
      //       messages = messages.slice(1);
      //     }
      //   }
      //   currMessage = "";
      // } else {
      //   mainWindow.webContents.send("kantar", ["0"]);
      //   currMessage = "";
      // }
    });
  }

  mainWindow.maximize();
  if (args.includes("serve")) {
    mainWindow.loadURL("http://localhost:4200");
  } else {
    mainWindow.loadURL(`file://${__dirname}/out/rota-kantar/index.html`)
  }
  // var a = await autoUpdater.checkForUpdates();
  // console.log(a);
}

app.allowRendererProcessReuse = false;
app.on("ready", createWindow);
app.on("window-all-closed", function () {
  app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});

// autoUpdater.on("update-available", () => {
//   mainWindow.webContents.send("update_available");
//   mainWindow.webContents.send("print", "update_available");
// });

// autoUpdater.on('download-progress', (progressObj) => {
//   console.log(progressObj.percent);

//   let log_message = "Hız: " + progressObj.bytesPerSecond;
//   log_message = log_message + ' - İndirilen ' + progressObj.percent + '%';
//   log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
//   mainWindow.webContents.send("download-progress", { text: log_message, data: progressObj });
//   mainWindow.webContents.send("print", { text: log_message, data: progressObj });
// });

// autoUpdater.on("update-downloaded", () => {
//   mainWindow.webContents.send("update_downloaded");
// });

// autoUpdater.on("error", (message) => {
//   mainWindow.webContents.send("print", message);
// });

ipcMain.on("app_version", (event) => {
  event.sender.send("app_version", { version: app.getVersion() });
});

// ipcMain.on("restart_app", () => {
//   autoUpdater.quitAndInstall();
// });

ipcMain.on("restart", async (event, data) => {
  app.exit();
  app.relaunch();
});

const options = {
  printer: config.printer,
};

ipcMain.on("onprint", async (event, data) => {
  const filePath = path.join(`./CV_Deniz_Arda_Murat.pdf`);
  await ptp.print(filePath, options);
});
