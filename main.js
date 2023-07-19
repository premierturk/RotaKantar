const { app, BrowserWindow, ipcMain } = require('electron');
const { SerialPort } = require('serialport');
const path = require("path");
const Shortcut = require("electron-shortcut");

const kantarName = "Kantar_1"; //Configürasyonlardan hangisi seçilecekse ismi
//
const config = require("./kantarConfigs.json")[kantarName];

//

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
            preload: path.join(__dirname, 'preload.js')
        }
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
                return console.log('Error opening port: ', err.message)
            }
        });
        port.on('error', function (err) {
            console.log('Error: ', err.message)
        });

        var allMessage = "";
        port.on('data', function (data) {
            allMessage += new Buffer.from(data).toString();
            if (allMessage.endsWith("\\n")) {
                allMessage = allMessage.replace("\\n", "");
                console.log('Data:', allMessage);
                mainWindow.webContents.send('kantar', [allMessage]);
                allMessage = "";
            }
        });
    }

    mainWindow.maximize();
    mainWindow.loadFile('dist/ronesans-kantar/index.html');
}
ipc.on("onprint", async (event, data) => {
    // const exePath = path.join(__dirname, "print/PrintFis.exe");

    // // fisno: "1155",
    // // islemtarihi: "10.10.2010",
    // // islemsaat: "10:02",
    // // belgeno: "4587-2019",
    // // firma: "BAHADIR HAFRİYAT",
    // // plakano: "41 GG 4587",
    // // tonaj: "45874",
    // // dara: "15000",
    // // net: "32584",
    // // tutar: "1458,36",
    // // bakiye: "12898102",
    // // belgemik: "1000",
    // // belgetopdok: "3221",
    // // belgekalmik: "45666",

    // const parameter =
    //     "KENTKONUT_A.Ş " +
    //     replaceAll(" ", "_", data.fisno) +
    //     " " +
    //     replaceAll(" ", "_", data.islemtarihi) +
    //     " " +
    //     replaceAll(" ", "_", data.islemsaat) +
    //     " " +
    //     replaceAll(" ", "_", data.belgeno) +
    //     " " +
    //     replaceAll(" ", "_", data.firma) +
    //     " " +
    //     replaceAll(" ", "_", data.plakano) +
    //     " " +
    //     replaceAll(" ", "_", data.tonaj) +
    //     " " +
    //     replaceAll(" ", "_", data.dara) +
    //     " " +
    //     replaceAll(" ", "_", data.net) +
    //     " " +
    //     replaceAll(" ", "_", data.tutar) +
    //     " " +
    //     replaceAll(" ", "_", data.bakiye) +
    //     " " +
    //     replaceAll(" ", "_", data.belgemik) +
    //     " " +
    //     replaceAll(" ", "_", data.belgetopdok) +
    //     " " +
    //     replaceAll(" ", "_", data.belgekalmik);

    // console.log(exePath + " " + parameter);

    // nrc.run(exePath + " " + parameter).then(
    //     function (exitCodes) {
    //         console.log("printed", parameter + " " + exitCodes);
    //     },
    //     function (err) {
    //         console.log("Command failed to run with error: ", err);
    //     }
    // );
});

function replaceAll(find, replace, str) {
    while (str.indexOf(find) > -1) {
        str = str.replace(find, replace);
    }
    return str;
}
app.on('ready', createWindow);
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