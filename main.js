const { app, BrowserWindow, ipcMain } = require("electron");
const Shortcut = require("electron-shortcut");
const { autoUpdater } = require("electron-updater");
const { SerialPort } = require("serialport");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
var Promise = require("bluebird");
const hb = require("handlebars");
const inlineCss = require("inline-css");
const ptp = require("pdf-to-printer");
const moment = require("moment/moment");

class AppFiles {
  static kantarConfigs = `./kantarConfigs.json`;
  static kantarName = "C:\\RotaKantarName.json";
  static pdfTempHtml = "./pdf/template.html";
  static pdfOutput = "./pdf/output.pdf";
}

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
        return printToAngular("Error opening port: ", err.message);
      }
    });

    port.on("error", function (err) {
      printToAngular("Error: ", err.message);
    });

    var currMessage = "";
    var messages = [];
    port.on("data", function (data) {
      //printToAngular( data);

      currMessage += Buffer.from(data).toString();

      printToAngular("String Data =>" + currMessage);

      if (
        (currMessage.endsWith("\r") || currMessage.endsWith("\\r")) &&
        currMessage.startsWith("@")
      ) {
        currMessage = currMessage
          .replaceAll("\\r", "")
          .replaceAll("\r", "")
          .replaceAll("@", "")
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
    printToAngular("ONPRİNT");
    data = data[0];
    if (data.DaraTarih != null)
      data.DaraTarih = moment(data.DaraTarih).format("DD.MM.yyyy HH:mm");
    else data.DaraTarih = "";

    data.TartiTarih = moment(data.TartiTarih).format("DD.MM.yyyy HH:mm");

    printToAngular(data);
    var htmlFile = fs.readFileSync(AppFiles.pdfTempHtml, "utf-8");
    for (const [key, value] of Object.entries(data))
      htmlFile = htmlFile.replaceAll(`#${key}#`, value);
    const pdfOptions = { format: "A5" };
    printToAngular("generating pdf");

    generatePdf({ content: htmlFile }, pdfOptions).then((pdfBuffer) => {
      fs.writeFile(AppFiles.pdfOutput, pdfBuffer, "utf-8", async (err, res) => {
        if (err) {
          printToAngular(err);
          return;
        }

        printToAngular("pdf generated");

        printPdf();
      });
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

async function printPdf() {
  try {
    var printerList = await ptp.getPrinters();
    const printer = printerList.find((a) => a.name.includes(config.printer));
    if (printer == undefined || printer == null) {
      throw new Error("YAZICI BULUNAMADI!");
    }
    const printOptions = {
      printer: printer.deviceId,
    };
    printToAngular("printing");

    await ptp.print(AppFiles.pdfOutput, printOptions);
  } catch (error) {
    printToAngular(error);
  }
}

async function generatePdf(file, options, callback) {
  try {
    // we are using headless mode
    let args = ["--no-sandbox", "--disable-setuid-sandbox"];
    if (options.args) {
      args = options.args;
      delete options.args;
    }
    var launchOpts = { args: args };
    if (app.isPackaged) {
      var path = __dirname.replace("app.asar", "app.asar.unpacked");
      path +=
        "\\node_modules\\puppeteer\\.local-chromium\\win64-901912\\chrome-win\\chrome.exe";
      launchOpts.executablePath = path;
    }
    const browser = await puppeteer.launch(launchOpts);
    const page = await browser.newPage();

    if (file.content) {
      data = await inlineCss(file.content, { url: "/" });
      // we have compile our code with handlebars
      const template = hb.compile(data, { strict: true });
      const result = template(data);
      const html = result;

      // We set the page content as the generated html by handlebars
      await page.setContent(html, {
        waitUntil: "networkidle0", // wait for page to load completely
      });
    } else {
      await page.goto(file.url, {
        waitUntil: ["load", "networkidle0"], // wait for page to load completely
      });
    }

    return Promise.props(page.pdf(options))
      .then(async function (data) {
        await browser.close();

        return Buffer.from(Object.values(data));
      })
      .asCallback(callback);
  } catch (error) {
    printToAngular(error);
  }
}

function printToAngular(message) {
  mainWindow.webContents.send("print", message);
}
