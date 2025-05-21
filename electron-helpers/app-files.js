const { app } = require("electron");
const path = require("path");

class AppFiles {
    static kantarConfig = path.join(app.getPath("userData"), `kantarConfig.json`);
    static tempTxt = "fis/template.txt";
    static outTxt = "fis/output.txt";
    static exePath = "fis/PrintFis.exe";
    //old
    static old_kantarConfigs = `kantarConfigs.json`;
    static old_kantarName = "C:\\RotaKantarName.json";
    // static tempTxt = "fis/template.txt";
    // static outTxt = "fis/output.txt";
    // static exePath = "fis/PrintFis.exe";
}

module.exports = AppFiles;