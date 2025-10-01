const { SerialPort } = require("serialport");
const AppConfig = require("./app-config");

//#region main.js variables
var mainWindow;
var printToAngular;
var dialog;
//#endregion

var currMessage = "";
var messages = [];

function initializeMainJsVariables() {
    const mainJs = require("../main");
    mainWindow = mainJs.mainWindow;
    printToAngular = mainJs.printToAngular;
    dialog = mainJs.dialog;
}

intFromString = (s) => parseInt(s.replaceAll(" ", "").split('').filter(a => !isNaN(a)).join(''));

class KantarPort {
    static port;
    static start() {
        if (!AppConfig.kantar) return;
        initializeMainJsVariables();
        //Serialport
        this.port = new SerialPort(AppConfig.serialPort);

        this.port.open(this.openning);
        this.port.on("error", this.onError);

        this.port.on("data", this.onData);

        mainWindow.on("minimize", () => {
            this.port.close();

        });

        mainWindow.on("maximize", () => {
            if (!this.port.isOpen) {
                this.port.open(this.openning);
            }
        });
    }

    static openning(err) {
        if (err) {
            dialog.showErrorBox("Error opening port!", err.message);
        }
    }

    static onError(err) {
        console.log("Error: " + err.message);
        printToAngular("Error: " + err.message);
    }

    static dataParser(msg) {
        switch (AppConfig.kantarMarka) {
            case "Tunay":
                if (msg == null) return 0;
                var arr = msg.split(" ");
                if (arr.length < 2) return 0;
                else if (arr[1].length < 6) return 0;

                return parseInt(arr[1]);
            case "Esit":
                if (!msg.startsWith("@") && !currMessage.startsWith("B")) {
                    mainWindow.webContents.send("kantar", [0]);//Tonaj sabit değilse direkt sıfırla esit için @ sabit B boş demek
                    return 0;
                }

                return intFromString(msg);
            default:
                return intFromString(msg);
        }
    }

    static onData(data) {
        currMessage += Buffer.from(data).toString();

        printToAngular("Coming Data =>" + currMessage);

        if (currMessage.length > 50) { currMessage = ""; return; }

        if (!currMessage.endsWith("\r") && !currMessage.endsWith("\\r") && !currMessage.endsWith("\n") && !currMessage.endsWith("\\n")) return;

        currMessage = currMessage
            .replaceAll("\\r", "")
            .replaceAll("\r", "")
            .replaceAll("\\n", "")
            .replaceAll("\n", "");

        if (currMessage.split('').every(a => isNaN(a))) return;

        //Default : delete spaces and take only numeric digits !!!!!
        currMessage = KantarPort.dataParser(currMessage);

        printToAngular("Parsed => " + currMessage);

        messages.push(currMessage);

        if (messages.length == 5) {
            let allSame = new Set(messages).size == 1;

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
}

module.exports = KantarPort;
