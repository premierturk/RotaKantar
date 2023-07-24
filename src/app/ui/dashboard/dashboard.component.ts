import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup } from '@angular/forms';
import {
  DataStateChangeEvent,
  GridComponent,
  GridDataResult,
} from '@progress/kendo-angular-grid';
import { State } from '@progress/kendo-data-query';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from 'ngx-electron';
import { ButtonType, DataSource } from 'src/app/service/datasource';
import { environment } from 'src/app/environment';
import * as Notiflix from 'node_modules/notiflix/dist/notiflix-3.2.6.min.js';
import Swal from 'sweetalert2';
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
  }
  private url: string = environment.production ? environment.apiUrl : '/api';
  @ViewChild('grid') grid: GridComponent;
  public view: GridDataResult;
  public form: FormGroup;
  public ButtonType = ButtonType;
  public state: State = {
    skip: 0,
    take: 17,
    sort: [
      {
        field: 'siraNo',
        dir: 'asc',
      },
    ],
  };

  public formData: any = { FirmaAdi: '' };

  public dsPlaka: Array<any> = [];
  public dsMalzemeTur: Array<any> = [];
  public f_dsPlaka: Array<any> = [];
  public f_dsMalzemeTur: Array<any> = [];

  ngOnInit(): void {
    this.BindGrid();
    this.BindForm();
    //Swal.fire('Bilgilendirme', 'TEST', 'warning');
  }

  onDataKantar(event, data) {
    const component = DashboardComponent.componentInstance;
    component.formData.Tonaj = parseInt(data[0]);
    component.ref.detectChanges();
    console.log(data);
  }

  plakaSelected(a) {
    const arac = this.dsPlaka.filter((x) => x.AracId == a)[0];
    this.formData.AracId = arac.AracId;
    this.formData.Dara = arac.Dara;
    this.formData.FirmaAdi = arac.FirmaAdi;
    this.formData.FirmaId = arac.FirmaId;
  }

  async BindForm() {
    this.dsPlaka = await this.ds.get(`${this.url}/api/AracList`);
    this.handleFilterArac('');
    this.dsMalzemeTur = await this.ds.get(`${this.url}/api/MalzemeTuruList`);
    this.handleFilterMalzeme('');

    const user = JSON.parse(localStorage.getItem('user'));
    this.formData.TasOcagiId = user.TasOcagiId;
  }

  async BindGrid() {
    this.view = await this.ds.get(`${this.url}/api/KantarList`);
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.state = state;
    this.BindGrid();
  }

  async save() {
    var err = this.validations();
    if (err != '') {
      Notiflix.Notify.failure(err);
      return;
    }
    var result = await this.ds.post(
      `${this.url}/api/KantarList`,
      this.formData
    );
    if (result) {
      this.formData = {};
      this.BindGrid();
    }
  }

  handleFilterArac(keyword) {
    this.f_dsPlaka = this.dsPlaka.filter((x) =>
      x.PlakaNo.includes(keyword.toUpperCase())
    );
  }

  handleFilterMalzeme(keyword) {
    this.f_dsMalzemeTur = this.dsMalzemeTur.filter((x) =>
      x.MalzemeTuru.includes(keyword.toUpperCase())
    );
  }

  async clearForm() {
    this.formData = { FirmaAdi: '' };
  }

  public validations(): string {
    var s = '';
    if (this.formData.AracId == null) s = 'Lütfen plaka seçin.';
    else if (this.formData.MalzemeTipiId == null)
      s = 'Lütfen malzeme türü seçin.';
    else if (this.formData.FirmaId == null) s = 'Firma bulunamadı.';
    else if (this.formData.Dara == null || this.formData.Dara < 1)
      s = 'Dara bulunamadı.';
    else if (this.formData.TasOcagiId == null) s = 'Taş ocağı bulunamadı.';
    else if (this.formData.Tonaj == null || this.formData.Tonaj < 1)
      s = 'Tonaj bulunamadı.';
    return s;
  }
}
