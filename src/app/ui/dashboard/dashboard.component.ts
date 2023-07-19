import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataStateChangeEvent, GridComponent, GridDataResult } from '@progress/kendo-angular-grid';
import { process, State } from '@progress/kendo-data-query';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from 'ngx-electron';
import { ButtonType, DataSource } from 'src/app/service/datasource';
import { environment } from 'src/app/environment';
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
    private ds: DataSource
  ) {
    if (this._electronService.ipcRenderer)
      this._electronService.ipcRenderer.on('kantar', this.onDataKantar);
    DashboardComponent.componentInstance = this;
    this.form = new FormGroup({
      plakaNo: new FormControl(this.formData.plakaNo, [Validators.required]),
      malzemeTur: new FormControl(this.formData.malzemeTur, [Validators.required]),
    });
  }
  private url: string = environment.production ? environment.apiUrl : "/api";
  @ViewChild('grid') grid: GridComponent;
  public view: GridDataResult;
  public form: FormGroup;
  public ButtonType = ButtonType;
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
  public formData: any = {
    randevuSonucAdi: '',
    aktif: true,
  };
  public dsPlaka: Array<any> = [];
  public dsMalzemeTur: Array<any> = [];

  ngOnInit(): void {
    this.BindForm();
  }

  onDataKantar(event, data) {
    const component = DashboardComponent.componentInstance;

    component.serialPortMessages.push(data);
    console.log(data);
  }

  async BindForm() {
    this.view = await this.ds.get(`${this.url}/api/KantarList`);
    this.dsPlaka = await this.ds.get(`${this.url}/api/AracList`);
    this.dsMalzemeTur = await this.ds.get(`${this.url}/api/MalzemeTuruList`);
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.state = state;
  }

  async kaydet() {

  }
}
