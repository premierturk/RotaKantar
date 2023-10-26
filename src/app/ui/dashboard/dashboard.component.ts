import { Component, OnInit, ViewChild, ChangeDetectorRef, HostListener, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataStateChangeEvent, GridComponent, GridDataResult, RowClassArgs } from '@progress/kendo-angular-grid';
import { State, process } from '@progress/kendo-data-query';
import { ElectronService } from 'ngx-electron';
import { ButtonType, DataSource } from 'src/app/service/datasource';
import { environment } from 'src/environment';
import * as Notiflix from 'node_modules/notiflix/dist/notiflix-3.2.6.min.js';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { SVGIcon, fileExcelIcon } from "@progress/kendo-svg-icons";
import { ExcelExportData } from '@progress/kendo-angular-excel-export';
import helper from 'src/app/service/helper';
import { DokumEditComponent } from '../dokum-edit/dokum-edit.component';
import { AppNetworkStatus } from 'src/app/network-status';
@Component({
  selector: 'app-tespit-history',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  static componentInstance: any;
  private url: string = environment.production ? environment.apiUrl : '/api';
  @ViewChild('grid') grid: GridComponent;
  public ButtonType = ButtonType;
  public fileExcelIcon: SVGIcon = fileExcelIcon;
  public view: GridDataResult;
  public list: any[];
  public state: State = {
    skip: 0,
    take: 20,
  };
  public formData: any;
  private emptyFormData: any = { FirmaAdi: '', Tonaj: 0, Dara: 0, IrsaliyeNo: '', Aciklama: '' };
  public dsPlaka: Array<any> = [];
  public dsMalzemeTur: Array<any> = [];
  public dsTasOcaklari: Array<any> = [];
  public dsProjeAlanlari: Array<any> = [];
  public f_dsPlaka: Array<any> = [];
  public f_dsMalzemeTur: Array<any> = [];
  public f_dsTasOcaklari: Array<any> = [];
  public f_dsProjeAlanlari: Array<any> = [];
  public selectedItem: any = {};
  public saveDisabled: boolean = false;
  public barcode: string = '';
  public isLoading: boolean = false;
  public user: any;
  public basTar: Date;
  public bitTar: Date;
  public mySelections: any[] = [];

  constructor(
    public modalService: NgbModal,
    private _electronService: ElectronService,
    private ref: ChangeDetectorRef,
    private ds: DataSource,
    public help: helper,
  ) {
    this.allData = this.allData.bind(this);
    DashboardComponent.componentInstance = this;
    if (this._electronService.ipcRenderer) {
      this._electronService.ipcRenderer.on('kantar', this.onDataKantar);
    }
  }

  ngOnInit(): void {
    this.formData = Object.assign(this.emptyFormData);
    var now = new Date();
    this.basTar = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this.bitTar = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this.BindGrid();
    this.BindForm();
    //Swal.fire('Bilgilendirme', 'TEST', 'warning');
  }

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      console.log(this.barcode);
      var plaka = this.plakaFromBarcode(this.barcode);
      console.log(plaka);
      const arac = this.dsPlaka.find((x) => plaka.toUpperCase() == x.PlakaNo);
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
    if (!AppNetworkStatus.isOffline) {
      this.isLoading = true;
      const res = await this.ds.get(`${this.url}/api/Kantar/SonTasOcagiCikis?AracId=${arac.AracId}&ProjeId=${this.user.ProjeId}`);
      //if (res.TasOcagiId == undefined || res.TasOcagiId == null) Notiflix.Notify.failure("");
      this.isLoading = false;
      this.formData.TasOcagiId = res.TasOcagiId;
      this.formData.TasOcagiGirisTarihi = res.TasOcagiGirisTarihi;
      this.formData.Latitude = res.Latitude;
      this.formData.Longitude = res.Longitude;
    }

    this.fillForm(arac);
  }

  async excel() {
    this.grid.saveAsExcel();
  }

  public allData(): ExcelExportData {
    var excelList = this.list;
    for (var item of excelList) {
      item.TartiTarih = moment(item.TartiTarih).format("DD/MM/yyyy HH:mm");

    }
    const result: ExcelExportData = process(excelList, {});
    return result;
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
    this.dsTasOcaklari = await this.ds.get(`${this.url}/api/Kantar/TasOcaklariMini?ProjeId=${this.user.ProjeId}`);
    this.handleFilterTasOcak('');
    this.dsProjeAlanlari = await this.ds.get(`${this.url}/api/Kantar/ProjeAlanlari?ProjeId=${this.user.ProjeId}`);
    this.handleProjeAlanlari('');
  }

  public async BindGrid() {
    this.clearSelections();
    this.list = await this.ds.get(`${this.url}/api/KantarListV3?basTar=${moment(this.basTar).format('yyyy-MM-DD')}&bitTar=${moment(this.bitTar).add(1, 'days').format('yyyy-MM-DD')}`);
    this.view = process(this.list, this.state);
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.state = state;
    this.view = process(this.list, this.state);
  }

  public onCellClick(a) {
    this.selectedItem = a.dataItem;
  }

  public handleFilterArac(keyword) {
    this.f_dsPlaka = this.dsPlaka.filter((x) => x.PlakaNo.includes(keyword.toUpperCase()));
  }

  public handleFilterMalzeme(keyword) {
    this.f_dsMalzemeTur = this.dsMalzemeTur.filter((x) => x.MalzemeTuru.includes(keyword.toUpperCase()));
  }

  public handleFilterTasOcak(keyword) {
    this.f_dsTasOcaklari = this.dsTasOcaklari.filter((x) => x.Adi.toUpperCase().includes(keyword.toUpperCase()));
  }

  public handleProjeAlanlari(keyword) {
    this.f_dsProjeAlanlari = this.dsProjeAlanlari.filter((x) => x.AlanAdi.toUpperCase().includes(keyword.toUpperCase()));
  }

  public print(data) {
    if (data == null) return;

    if (this._electronService.ipcRenderer)
      this._electronService.ipcRenderer.send('onprint', [data]);

    this.clearSelections();
  }

  public clearSelections() {
    this.selectedItem = undefined;
    this.mySelections = [];
  }

  public rowCallback = (context: RowClassArgs) => {
    return { localData: context.dataItem.TartiNo == null };
  };

  public edit(a) {
    const modalRef = this.help.openModal(this.modalService, DokumEditComponent, "m");
    modalRef.componentInstance.dokum = a;
    modalRef.result.then((data) => {
      this.BindGrid();
    });
  }

  async save() {
    this.formData.TanimlarKantarId = await window.localStorage.getItem("KantarId");
    this.formData.ProjeId = this.user.ProjeId;
    this.formData.IsOffline = AppNetworkStatus.isOffline;
    var err = this.validations();
    if (err != '') {
      Notiflix.Notify.failure(err);
      return;
    }
    this.isLoading = true;
    var result = await this.ds.post(`${this.url}/api/KantarV2`, this.formData);
    this.isLoading = false;
    if (result.success) {
      this.print(result.data);
      this.formData = Object.assign(this.emptyFormData);
      this.BindGrid();
    }
  }

  async daraGuncelle() {
    if (this.formData.AracId == null || this.formData.Tonaj == null || this.formData.Tonaj < 1) {
      Notiflix.Notify.failure('Araç ve ya tonaj bilgisi alınamadı!');
      return;
    }

    const arac = this.dsPlaka.filter((x) => x.AracId == this.formData.AracId)[0];

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
    var result = await this.ds.post(`${this.url}/api/Kantar/Dara`, { AracId: this.formData.AracId, Dara: this.formData.Tonaj });
    this.isLoading = false;
    if (result.success) {
      this.formData = Object.assign(this.emptyFormData);
      this.dsPlaka = await this.ds.get(`${this.url}/api/AracList`);
      this.handleFilterArac('');
    }
  }

  public validations(): string {
    var s = '';
    if (this.formData.AracId == null) s = 'Lütfen plaka seçin.';
    else if (this.formData.MalzemeTipiId == null) s = 'Lütfen malzeme türü seçin.';
    else if (this.formData.FirmaId == null) s = 'Firma bulunamadı.';
    else if (this.formData.ProjeId == null) s = 'Proje bulunamadı.';
    else if (this.formData.Dara == null || this.formData.Dara < 1) s = 'Dara bulunamadı.';
    else if (this.formData.TasOcagiId == null) s = 'Taş ocağı bulunamadı.';
    else if (this.formData.Tonaj == null || this.formData.Tonaj < 1) s = 'Tonaj bulunamadı.';
    else if (this.formData.ProjeAlaniId == null) s = 'Proje Alanı bulunamadı.';
    return s;
  }
}
