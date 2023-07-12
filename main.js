const { app, BrowserWindow, ipcMain } = require('electron');
const { SerialPort } = require('serialport');
const path = require("path");
const Shortcut = require("electron-shortcut");
const { killPortProcess } = require("kill-port-process");

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

app.on('ready', createWindow);
app.allowRendererProcessReuse = false;

app.on("window-all-closed", function () {

    killPortProcess(config.TcpPort).then(console.log).catch(console.log);

    app.quit();
});
app.on("activate", function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open. 
    if (mainWindow === null) createWindow();
});

ipcMain.on("restart", async (event, data) => {
    app.exit();
    app.relaunch();
});