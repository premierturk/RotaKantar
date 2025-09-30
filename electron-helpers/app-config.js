const fs = require("fs");
const AppFiles = require("./app-files");
const { app } = require("electron");
const { ayarlarMenu } = require("./ayarlar/ayarlarMenu");

var sendToAngular = (config) =>
    require("../main").mainWindow.webContents.send("kantarConfig", config);

var printToAngular = (msg) =>
    require("../main").mainWindow.webContents.send("print", msg);

var dialog = require("../main").dialog;


class SerialPortConfigs {
    path;
    autoOpen;
    baudRate;
    dataBits;
    parity;

    constructor(_config) {
        for (const [key, value] of Object.entries(_config)) this[key] = value;
    }
}

class AppConfig {
    static kantarId;
    static kantarAdi;
    static kantar;
    static printerName;
    static isPrinterOn;
    static kantarMarka;
    static url;
    static serialPort = new SerialPortConfigs({});

    static initialize() {
        if (!fs.existsSync(AppFiles.kantarConfig)) {
            fs.appendFileSync(AppFiles.kantarConfig, "");

            checkOldConfiguration();
            return;
        }

        var config = fs.readFileSync(AppFiles.kantarConfig, "utf-8");
        var jsonConfig = JSON.parse(config);

        if (config == "") {
            ayarlarMenu.items[0].click();
            return;
        }

        setTimeout(() => sendToAngular(config), 2000);
        for (const [key, value] of Object.entries(jsonConfig)) {
            if (key != "serialPort") this[key] = value;
            else this[key] = new SerialPortConfigs(value);
        }
    }

    static update(event, data) {
        fs.writeFile(AppFiles.kantarConfig, JSON.stringify(data), (err, res) => {
            if (err) {
                printToAngular(err);
                dialog.showErrorBox("Error updating config!", err);
                return;
            }
            sendToAngular(JSON.stringify(data));
            app.relaunch();
            app.exit();
        });
    }
}

function checkOldConfiguration() {
    const configJsonFile = JSON.parse(fs.readFileSync(AppFiles.old_kantarConfigs));
    const kantarName = JSON.parse(fs.readFileSync(AppFiles.old_kantarName)).kantarName;
    if (kantarName == "" || kantarName == undefined) return;

    var config = configJsonFile[kantarName];
    if (config == undefined) return;
    if (config.kantarId == undefined) return;

    //old configuration to new 
    config.url = 'https://rotamag.ronesans.com/Api';

    if (!config.kantarMarka) {
        if (config.url == null || config.url.includes("mag")) {
            config.kantarMarka = "Esit";
        }
        else {
            config.kantarMarka = "Diğer";
        }
    }

    AppConfig.update(null, config);

}


module.exports = AppConfig;
