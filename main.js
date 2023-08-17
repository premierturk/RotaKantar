const { app, BrowserWindow, ipcMain } = require("electron");
const { SerialPort } = require("serialport");
const path = require("path");
const ptp = require("pdf-to-printer");
const Shortcut = require("electron-shortcut");   
const fs = require('fs');

var args = process.argv; 

var resourcesRoot = fs.existsSync("./kantarConfigs.json") ? "./" : "./resources/";

const jsonFile = JSON.parse(fs.readFileSync(resourcesRoot+'kantarConfigs.json'));  
const config = jsonFile[jsonFile.aktifKantar];

 if(config==undefined){
  throw new Error("KANTAR KONFİGÜRASYONU BULUNAMADI!");
 }
 
function createWindow() {
  let mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon:path.join(__dirname, "assets/icon.ico") 
  });

  mainWindow.setMenu(null);

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
      currMessage += new Buffer.from(data).toString();
      if (currMessage.endsWith("\\n")) {
        currMessage = currMessage.replace("\\n", "");
        console.log("Data:", currMessage);

        messages.push(currMessage);

        if (messages.length == 10) {
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
      }
    });
  }

  mainWindow.maximize();

  if (args.includes("serve")) {
    mainWindow.loadURL("http://localhost:4200");
  } else {
    mainWindow.loadURL(`file://${__dirname}/out/rota-kantar/index.html`)
  }
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

const options = {
  printer: config.printer,
};

ipcMain.on("onprint", async (event, data) => {
  const filePath = path.join(`./CV_Deniz_Arda_Murat.pdf`);
  await ptp.print(filePath, options);
});
