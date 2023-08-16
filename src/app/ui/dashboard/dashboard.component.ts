import { Component, OnInit, ViewChild, ChangeDetectorRef, HostListener } from '@angular/core';
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
  styleUrls: ['./dashboard.component.scss'],
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
    if (this._electronService.ipcRenderer) {
      this._electronService.ipcRenderer.on('kantar', this.onDataKantar);
    }
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

  public formData: any = { FirmaAdi: '', Tonaj: 0 };
  public defaultForm: any = {};
  public dsPlaka: Array<any> = [];
  public dsMalzemeTur: Array<any> = [];
  public f_dsPlaka: Array<any> = [];
  public f_dsMalzemeTur: Array<any> = [];
  public saveDisabled: boolean = false;
  public barcode: string = "";

  public user: any;
  ngOnInit(): void {
    this.BindGrid();
    this.BindForm();
    Swal.fire('Bilgilendirme', 'TEST', 'warning');
  }

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key == "Enter") {
      console.log(event.key);
      const arac = this.dsPlaka.filter((x) => this.barcode.toLocaleUpperCase().includes(x.PlakaNo))[0];
      this.fillForm(arac);
      this.barcode = "";
      return;
    }

    this.barcode += event.key;
  }

  onDataKantar(event, data) {
    console.log(data);
    const component = DashboardComponent.componentInstance;
    component.formData.Tonaj = parseInt(data[0]);
    component.ref.detectChanges();
  }

  public plakaSelected(a) {
    const arac = this.dsPlaka.filter((x) => x.AracId == a)[0];
    this.fillForm(arac);
  }

  public fillForm(arac) {
    if (arac != undefined && arac != null) {
      this.formData.AracId = arac.AracId;
      this.formData.Dara = arac.Dara;
      this.formData.FirmaAdi = arac.FirmaAdi;
      this.formData.FirmaId = arac.FirmaId;
    }
  }

  public clearForm() {
    this.formData = this.defaultForm;
  }

  public async BindForm() {
    this.dsPlaka = await this.ds.get(`${this.url}/api/AracList`);
    this.handleFilterArac('');
    this.dsMalzemeTur = await this.ds.get(`${this.url}/api/MalzemeTuruList`);
    this.handleFilterMalzeme('');

    this.user = JSON.parse(localStorage.getItem('user'));
  }

  public async BindGrid() {
    this.view = await this.ds.get(`${this.url}/api/KantarList`);
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.state = state;
    this.BindGrid();
  }

  public handleFilterArac(keyword) {
    this.f_dsPlaka = this.dsPlaka.filter((x) =>
      x.PlakaNo.includes(keyword.toUpperCase())
    );
  }

  public handleFilterMalzeme(keyword) {
    this.f_dsMalzemeTur = this.dsMalzemeTur.filter((x) =>
      x.MalzemeTuru.includes(keyword.toUpperCase())
    );
  }

  async save() {
    this.formData.TasOcagiId = this.user.TasOcagiId;
    var err = this.validations();
    if (err != '') {
      Notiflix.Notify.failure(err);
      return;
    }
    var result = await this.ds.post(
      `${this.url}/api/Kantar`,
      this.formData
    );
    if (result) {
      this.clearForm();
      this.BindGrid();
    }
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
