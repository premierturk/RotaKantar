const { app, BrowserWindow, ipcMain } = require("electron");
const Shortcut = require("electron-shortcut");
const { autoUpdater } = require("electron-updater");
const { SerialPort } = require("serialport");
const path = require("path");
const fs = require("fs");
const moment = require("moment/moment");
var nrc = require("node-run-cmd");

class AppFiles {
  static kantarConfigs = `kantarConfigs.json`;
  static kantarName = "C:\\RotaKantarName.json";
  static tempTxt = "fis/template.txt";
  static outTxt = "fis/output.txt";
  static exePath = "fis/PrintFis.exe";
}

const configJsonFile = JSON.parse(fs.readFileSync(AppFiles.kantarConfigs));
const kantarName = JSON.parse(fs.readFileSync(AppFiles.kantarName)).kantarName;
if (kantarName == "" || kantarName == undefined)
  throw new Error("(RotaKantarName.json) KANTAR ADI BULUNAMADI!");

const config = configJsonFile[kantarName];
if (config == undefined) throw new Error("KANTAR KONFİGÜRASYONU BULUNAMADI!");
if (config.kantarId == undefined) throw new Error("KANTAR ID BULUNAMADI!");

let mainWindow;
var args = process.argv;

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
    icon: path.join(__dirname, "assets/icon.ico"),
  });
  mainWindow.setMenu(null);
  mainWindow.setTitle("Rota Kantar v" + app.getVersion());

  new Shortcut("Ctrl+F12", function (e) {
    mainWindow.webContents.openDevTools();
  });

  //Serialport
  if (config.kantar) {
    const port = new SerialPort(config.serialPort);

    port.open(function (err) {
      if (err) {
        return printToAngular("Error opening port: ", err.message);
      }
    });

    port.on("error", function (err) {
      printToAngular("Error: ", err.message);
    });

    var currMessage = "";
    var messages = [];
    port.on("data", function (data) {

      currMessage += Buffer.from(data).toString();

      printToAngular("String Data =>" + currMessage);

      if (
        (currMessage.endsWith("\r") || currMessage.endsWith("\\r")) &&
        (currMessage.startsWith("@") || currMessage.startsWith("B"))
      ) {
        currMessage = currMessage
          .replaceAll("\\r", "")
          .replaceAll("\r", "")
          .replaceAll("@", "")
          .replaceAll("B", "")
          .replaceAll(" ", "");

        printToAngular("Parsed => " + currMessage);

        messages.push(currMessage);

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
        currMessage = "";
      } else if (currMessage.endsWith("\r")) {
        mainWindow.webContents.send("kantar", ["0"]);
        currMessage = "";
      }
      if (currMessage.length > 50) currMessage = "";
    });
  }

  mainWindow.maximize();
  if (args.includes("serve")) {
    mainWindow.loadURL("http://localhost:4200");
  } else {
    mainWindow.loadURL(`file://${__dirname}/out/rota-kantar/index.html`);
  }

  setTimeout(() => {
    autoUpdater.checkForUpdates();
    mainWindow.webContents.send("KantarId", config.kantarId);
    mainWindow.webContents.send("KantarAdi", config.kantarAdi);
  }, 4000);
}

app.allowRendererProcessReuse = false;
app.on("ready", createWindow);

app.on("window-all-closed", function () {
  app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});

ipcMain.on("restart_update", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on("onprint", async (event, data) => {
  if (!config.isPrinterOn) return;
  try {
    printToAngular("ONPRİNT");
    data = data[0];
    if (data.DaraTarih != null)
      data.DaraTarih = moment(data.DaraTarih).format("DD.MM.yyyy HH:mm");
    else data.DaraTarih = "";

    data.TartiTarih = moment(data.TartiTarih).format("DD.MM.yyyy HH:mm");

    printToAngular(data);
    var fisTxt = fs.readFileSync(AppFiles.tempTxt, "utf-8");
    for (const [key, value] of Object.entries(data))
      fisTxt = fisTxt.replaceAll(`{{${key}}}`, value ?? "");

    fs.writeFile(AppFiles.outTxt, fisTxt, (err, res) => {
      if (err) {
        printToAngular(err);
        return;
      }
      const command =
        AppFiles.exePath + `"${config.printerName}" "${AppFiles.outTxt}"`;

      nrc.run(command).then(
        function (exitCodes) {
          printToAngular("printed  " + exitCodes);
        },
        function (err) {
          printToAngular("Command failed to run with error: " + err);
        }
      );
    });
  } catch (error) {
    printToAngular(error);
  }
});

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

autoUpdater.on("error", (message) => {
  printToAngular(message);
});

function printToAngular(message) {
  mainWindow.webContents.send("print", message);
}
