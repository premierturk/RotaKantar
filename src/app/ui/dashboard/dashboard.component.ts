import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataStateChangeEvent, GridComponent, GridDataResult } from '@progress/kendo-angular-grid';
import { process, State } from '@progress/kendo-data-query';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from 'ngx-electron';
@Component({
  selector: 'app-tespit-history',
  templateUrl: './dashboard.component.html',
  styles: [],
})
export class DashboardComponent implements OnInit {
  static componentInstance: any;
  constructor(
    public modalService: NgbModal,
    private http: HttpClient,
    private _electronService: ElectronService,
    private ref: ChangeDetectorRef,
  ) {

    if (this._electronService.ipcRenderer)
      this._electronService.ipcRenderer.on('kantar', this.onDataKantar);
    DashboardComponent.componentInstance = this;
  }

  @ViewChild('grid') grid: GridComponent;
  private url = 'http://localhost:8081';
  public view: GridDataResult;
  public list: any[];
  public serialPortMessages: any[] = [];
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
  i = 0;
  ngOnInit(): void {
    this.BindForm();
  }

  onDataKantar(event, data) {
    const component = DashboardComponent.componentInstance;
    component.serialPortMessages.push(data);
    component.ref.detectChanges();
  }

  async BindForm() {
    this.http.get<any>(`${this.url}/dolgu-listesi`).subscribe(data => {
      this.list = data;
      this.view = process(this.list, this.state);
    })
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.state = state;
    this.view = process(this.list, this.state);
  }

}
