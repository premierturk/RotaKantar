import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataStateChangeEvent, GridComponent, GridDataResult } from '@progress/kendo-angular-grid';
import { process, State } from '@progress/kendo-data-query';
import { ButtonType, DataSource } from 'src/app/service/datasource';
import helper from 'src/app/service/helper';
import { HttpClient } from '@angular/common/http';
import { NgxSerial } from 'ngx-serial';
import { Buffer } from "buffer";
@Component({
  selector: 'app-tespit-history',
  templateUrl: './dashboard.component.html',
  styles: [],
})
export class DashboardComponent implements OnInit {
  serial: NgxSerial;
  serialPortMessages: any[];
  port: any;
  constructor(public ds: DataSource, public help: helper, public modalService: NgbModal, private http: HttpClient) {
    let options = { baudRate: 9600, dataBits: 8, parity: 'none', bufferSize: 256, flowControl: 'none', portName: 'COM10' };
    this.serial = new NgxSerial(this.onMessageSerialPort, options, "\n");

  }

  @ViewChild('grid') grid: GridComponent;
  private url = 'api/History/';
  public view: GridDataResult;
  public message: string;
  public list: any[];
  public state: State = {
    skip: 0,
    take: 17,
    sort: [
      {
        field: "siraNo",
        dir: "asc",
      },
    ]
  };

  ngOnInit(): void {
    this.BindForm();
  }
  public connectSerialPort() {
    this.serial.connect((port: any) => {
      this.port = port;
    });
  }
  onMessageSerialPort(data) {
    var s = Buffer.from(data).toString();
    this.message += s;
    if (s.endsWith("\n")) {
      console.log("Message:" + this.message.replace("\n", ""));
      this.message = "";
    }
  }
  async BindForm() {
    this.http.get<any>('http://localhost:8081/dolgu-listesi').subscribe(data => {
      this.list = data;
      this.view = process(this.list, this.state);
    })
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.state = state;
    this.view = process(this.list, this.state);
  }

}
