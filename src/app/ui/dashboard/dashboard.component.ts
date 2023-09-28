import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup } from '@angular/forms';
import {
  DataStateChangeEvent,
  GridComponent,
  GridDataResult,
} from '@progress/kendo-angular-grid';
import { State, process } from '@progress/kendo-data-query';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from 'ngx-electron';
import { ButtonType, DataSource } from 'src/app/service/datasource';
import { environment } from 'src/environment';
import * as Notiflix from 'node_modules/notiflix/dist/notiflix-3.2.6.min.js';
import Swal from 'sweetalert2';
import * as moment from 'moment';
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
    DashboardComponent.componentInstance = this;
    if (this._electronService.ipcRenderer) {
      this._electronService.ipcRenderer.on('kantar', this.onDataKantar);
    }
  }
  private url: string = environment.production ? environment.apiUrl : '/api';
  @ViewChild('grid') grid: GridComponent;
  public view: GridDataResult;
  public list: any[];
  public form: FormGroup;
  public ButtonType = ButtonType;
  public state: State = {
    skip: 0,
    take: 20,
  };

  public formData: any = { FirmaAdi: '', Tonaj: 0, Dara: 0 };
  public dsPlaka: Array<any> = [];
  public dsMalzemeTur: Array<any> = [];
  public dsTasOcaklari: Array<any> = [];
  public f_dsPlaka: Array<any> = [];
  public f_dsMalzemeTur: Array<any> = [];
  public f_dsTasOcaklari: Array<any> = [];
  public saveDisabled: boolean = false;
  public barcode: string = '';
  public isLoading: boolean = false;
  public user: any;
  public basTar: Date;
  public bitTar: Date;

  ngOnInit(): void {
    this.BindGrid();
    this.BindForm();
    this.basTar = new Date();
    this.bitTar = moment(this.basTar).add('days', 1).toDate();
    //Swal.fire('Bilgilendirme', 'TEST', 'warning');
  }

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      console.log(this.barcode);
      var plaka = this.plakaFromBarcode(this.barcode);
      console.log(plaka);
      const arac = this.dsPlaka.filter(
        (x) => plaka.toUpperCase() == x.PlakaNo
      )[0];
      if (arac != undefined && arac != null) {
        this.plakaSelected(arac.AracId);
      }
      this.barcode = '';
      return;
    }

    this.barcode += event.key;
  }
  public plakaFromBarcode(code) {
    var arr = code.split(',000026');
    var s = arr[arr.length - 1];
    return s.replaceAll('Shift', '').replaceAll('Control', '');
  }

  onDataKantar(event, data) {
    console.log(data);
    const component = DashboardComponent.componentInstance;
    component.formData.Tonaj = parseInt(data[0]);
    component.ref.detectChanges();
  }

  public async plakaSelected(a) {
    const arac = this.dsPlaka.filter((x) => x.AracId == a)[0];
    this.isLoading = true;
    const res = await this.ds.get(
      `${this.url}/api/Kantar/SonTasOcagiCikis?AracId=${arac.AracId}&ProjeId=${this.user.ProjeId}`
    );
    this.isLoading = false;
    this.formData.TasOcagiId = res.TasOcagiId;
    this.formData.TasOcagiGirisTarihi = res.TasOcagiGirisTarihi;
    this.formData.Latitude = res.Latitude;
    this.formData.Longitude = res.Longitude;
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

  public async BindForm() {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.dsPlaka = await this.ds.get(`${this.url}/api/AracList`);
    this.handleFilterArac('');
    this.dsMalzemeTur = await this.ds.get(`${this.url}/api/MalzemeTuruList`);
    this.handleFilterMalzeme('');
    this.dsTasOcaklari = await this.ds.get(
      `${this.url}/api/Kantar/TasOcaklariMini?ProjeId=${this.user.ProjeId}`
    );
    this.handleFilterTasOcak('');
  }

  public async BindGrid() {
    var url = `${this.url}/api/KantarListV2`;
    url += `?basTar=${moment(this.basTar).format('yyyy-MM-DD')}`;
    url += `&bitTar=${moment(this.bitTar).format('yyyy-MM-DD')}`;

    this.list = await this.ds.get(url);
    this.view = process(this.list, this.state);
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.state = state;
    this.view = process(this.list, this.state);
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

  public handleFilterTasOcak(keyword) {
    this.f_dsTasOcaklari = this.dsTasOcaklari.filter((x) =>
      x.Adi.toUpperCase().includes(keyword.toUpperCase())
    );
  }

  async save() {
    this.formData.ProjeId = this.user.ProjeId;
    var err = this.validations();
    if (err != '') {
      Notiflix.Notify.failure(err);
      return;
    }
    this.isLoading = true;
    var result = await this.ds.post(`${this.url}/api/Kantar`, this.formData);
    this.isLoading = false;
    if (result.success) {
      if (this._electronService.ipcRenderer)
        this._electronService.ipcRenderer.send('onprint', [result.data]);

      this.formData = { FirmaAdi: '', Tonaj: 0, Dara: 0 };
      this.BindGrid();
    }
  }

  async daraGuncelle() {
    if (
      this.formData.AracId == null ||
      this.formData.Tonaj == null ||
      this.formData.Tonaj < 1
    ) {
      Notiflix.Notify.failure('Araç ve ya tonaj bilgisi alınamadı!');
      return;
    }

    const arac = this.dsPlaka.filter(
      (x) => x.AracId == this.formData.AracId
    )[0];

    const willDelete = await Swal.fire({
      title: `${arac.PlakaNo} plakalı aracın darası ${this.formData.Tonaj} kg olarak güncellensin mi?`,
      type: 'warning',
      showCloseButton: false,
      showCancelButton: true,
      allowOutsideClick: false,
      cancelButtonText: 'Hayır',
      confirmButtonText: 'Evet',
    });

    if (willDelete.value != true) return;

    this.isLoading = true;
    var result = await this.ds.post(`${this.url}/api/Kantar/Dara`, {
      AracId: this.formData.AracId,
      Dara: this.formData.Tonaj,
    });
    this.isLoading = false;
    if (result.success) {
      this.formData = { FirmaAdi: '', Tonaj: 0, Dara: 0 };
      this.dsPlaka = await this.ds.get(`${this.url}/api/AracList`);
      this.handleFilterArac('');
    }
  }

  public validations(): string {
    var s = '';
    if (this.formData.AracId == null) s = 'Lütfen plaka seçin.';
    else if (this.formData.MalzemeTipiId == null)
      s = 'Lütfen malzeme türü seçin.';
    else if (this.formData.FirmaId == null) s = 'Firma bulunamadı.';
    else if (this.formData.ProjeId == null) s = 'Proje bulunamadı.';
    else if (this.formData.Dara == null || this.formData.Dara < 1)
      s = 'Dara bulunamadı.';
    else if (this.formData.TasOcagiId == null) s = 'Taş ocağı bulunamadı.';
    else if (this.formData.Tonaj == null || this.formData.Tonaj < 1)
      s = 'Tonaj bulunamadı.';
    return s;
  }
}
