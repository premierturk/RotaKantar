const { app, BrowserWindow } = require('electron')

app.on('ready', createWindow)

function createWindow() {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });
    // and load the index.html of the app.
    win.loadFile('dist/ronesans-kantar/index.html');
}