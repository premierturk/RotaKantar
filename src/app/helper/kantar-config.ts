import { Injectable, isDevMode } from '@angular/core';
import { Utils } from './utils';

@Injectable({
    providedIn: 'root',
})
export class KantarConfig {
    kantarId: number;
    kantarAdi: string;
    kantar: boolean;
    printerName: string;
    isPrinterOn: boolean;
    kantarMarka: string;
    url: string;
    serialPort: SerialPort;
    serviceUrl: string;

    constructor() {
        var config = JSON.parse(localStorage.getItem("kantarConfig"));
        for (const [key, value] of Object.entries(config)) {
            if (key != "serialPort") this[key] = value;
            else this[key] = new SerialPort(value);
        }

        this.serviceUrl = Utils.isServing ? "/Api" : `${this.url}/Api`;
        //this.serviceUrl = `${this.url}/Api`;
        //console.log(this.serviceUrl);
    }
}


class SerialPort {
    path: string;
    baudRate: number;
    dataBits: number;
    parity: string;
    constructor(_config) {
        for (const [key, value] of Object.entries(_config)) this[key] = value;
    }
}