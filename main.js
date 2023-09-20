const { app, BrowserWindow, ipcMain } = require("electron");
const Shortcut = require("electron-shortcut");
const { autoUpdater } = require("electron-updater");
const { SerialPort } = require("serialport");
const path = require("path");
const fs = require("fs");
const ptp = require("pdf-to-printer");
const moment = require("moment/moment");
const html_to_pdf = require("html-pdf-node");

class AppFiles {
  static kantarConfigs = `kantarConfigs.json`;
  static kantarName = "C:\\RotaKantarName.json";
  static pdfTempHtml = "pdf/template.html";
  static pdfOutput = "pdf/output.pdf";

  static initRoutes() {
    const root = !app.isPackaged ? "./" : "./resources/";
    this.kantarConfigs = path.join(root + this.kantarConfigs);
    this.pdfDataXml = path.join(root + this.pdfDataXml);
    this.pdfTempHtml = path.join(root + this.pdfTempHtml);
    this.pdfOutput = path.join(root + this.pdfOutput);
  }
}

AppFiles.initRoutes();

const configJsonFile = JSON.parse(fs.readFileSync(AppFiles.kantarConfigs));
const kantarName = JSON.parse(fs.readFileSync(AppFiles.kantarName)).kantarName;
if (kantarName == "" || kantarName == undefined)
  throw new Error("(RotaKantarName.json) KANTAR ADI BULUNAMADI!");

const config = configJsonFile[kantarName];
if (config == undefined) throw new Error("KANTAR KONFİGÜRASYONU BULUNAMADI!");

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
        return console.log("Error opening port: ", err.message);
      }
    });

    port.on("error", function (err) {
      console.log("Error: ", err.message);
    });

    var currMessage = "";
    var messages = [];
    port.on("data", function (data) {
      //mainWindow.webContents.send("print", data);

      currMessage += Buffer.from(data).toString();

      mainWindow.webContents.send("print", "String Data =>" + currMessage);

      if (
        (currMessage.endsWith("\r") || currMessage.endsWith("\\r")) &&
        currMessage.startsWith("@")
      ) {
        currMessage = currMessage
          .replaceAll("\\r", "")
          .replaceAll("\r", "")
          .replaceAll("@", "")
          .replaceAll(" ", "");

        mainWindow.webContents.send("print", "Parsed => " + currMessage);

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
  try {
    mainWindow.webContents.send("print", "ONPRİNT");
    data = data[0];
    data.DaraTarih = moment(data.DaraTarih).format("DD.MM.yyyy HH:mm");
    data.TartiTarih = moment(data.TartiTarih).format("DD.MM.yyyy HH:mm");
    mainWindow.webContents.send("print", data);
    var htmlFile = fs.readFileSync(AppFiles.pdfTempHtml, "utf-8");
    for (const [key, value] of Object.entries(data))
      htmlFile = htmlFile.replaceAll(`#${key}#`, value);
    const pdfOptions = { format: "A5" };
    mainWindow.webContents.send("print", "generating pdf");
    await html_to_pdf
      .generatePdf({ content: htmlFile }, pdfOptions)
      .then((pdfBuffer) => {
        fs.writeFile(
          AppFiles.pdfOutput,
          pdfBuffer,
          "utf-8",
          async (err, res) => {
            mainWindow.webContents.send("print", "pdf generated");

            if (err) console.log(err);
            var printerList = await ptp.getPrinters();
            const printer = printerList.find((a) =>
              a.name.includes(config.printer)
            );
            if (printer == undefined || printer == null) {
              throw new Error("YAZICI BULUNAMADI!");
            }
            const printOptions = {
              printer: printer.deviceId,
            };
            mainWindow.webContents.send("print", "printing");

            await ptp.print(AppFiles.pdfOutput, printOptions);
          }
        );
      });
  } catch (error) {
    mainWindow.webContents.send("print", error);
  }
});

autoUpdater.on("update-available", () => {
  mainWindow.webContents.send("update_available");
  mainWindow.webContents.send("print", "update_available");
});

autoUpdater.on("download-progress", (progressObj) => {
  console.log(progressObj.percent);

  let log_message = "Hız: " + progressObj.bytesPerSecond;
  log_message = log_message + " - İndirilen " + progressObj.percent + "%";
  mainWindow.webContents.send("download_progress", {
    text: log_message,
    data: progressObj,
  });
  mainWindow.webContents.send("print", log_message);
});

autoUpdater.on("update-downloaded", () => {
  mainWindow.webContents.send("print", "update-downloaded");
  mainWindow.webContents.send("update_downloaded");
});

autoUpdater.on("error", (message) => {
  mainWindow.webContents.send("print", message);
});
