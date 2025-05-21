const AppConfig = require("./app-config");
const AppFiles = require("./app-files");
const fs = require("fs");
var nrc = require("node-run-cmd");
var moment = require('moment');

//main.js variables
var mainWindow;
var printToAngular;
var dialog;

function initializeMainJsVariables() {
    const mainJs = require("../main");
    mainWindow = mainJs.mainWindow;
    printToAngular = mainJs.printToAngular;
    dialog = mainJs.dialog;
}

class FisPrinter {
    static printFis(event, data) {
        initializeMainJsVariables();
        if (!AppConfig.isPrinterOn) return;
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
                if (err) { printToAngular(err); return; }
                const command = AppFiles.exePath + `"${AppConfig.printerName}" "${AppFiles.outTxt}"`;

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
            dialog.showErrorBox("Error printing!", error);

        }
    }
}

module.exports = FisPrinter;
