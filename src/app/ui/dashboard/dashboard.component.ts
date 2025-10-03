import { Component, OnInit, ViewChild, ChangeDetectorRef, HostListener, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataStateChangeEvent, ExcelExportEvent, GridComponent, GridDataResult, RowClassArgs } from '@progress/kendo-angular-grid';
import { State, aggregateBy, process } from '@progress/kendo-data-query';
import { ElectronService } from 'ngx-electron';
import { ButtonType, DataSource } from 'src/app/service/datasource';
import * as Notiflix from 'node_modules/notiflix/dist/notiflix-3.2.6.min.js';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { SVGIcon, fileExcelIcon } from "@progress/kendo-svg-icons";
import { ExcelExportData } from '@progress/kendo-angular-excel-export';
import helper from 'src/app/service/helper';
import { DokumEditComponent } from '../dokum-edit/dokum-edit.component';
import { AppNetworkStatus } from 'src/app/network-status';
import { KantarConfig } from 'src/app/helper/kantar-config';
@Component({
  selector: 'app-tespit-history',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  static componentInstance: any;
  private url: string = this.kantarConfig.serviceUrl;
  @ViewChild('grid') grid: GridComponent;
  public ButtonType = ButtonType;
  public fileExcelIcon: SVGIcon = fileExcelIcon;
  public view: GridDataResult;
  public list: any[] = [];
  public state: State = {
    skip: 0,
    take: 16,
  };
  public formData: any;
  private emptyFormData: any = { FirmaAdi: '', Tonaj: 0, Dara: 0, IrsaliyeNo: '', Aciklama: '' };
  public total: any = { "NetTonaj": { "sum": 0 } };
  public ddPlaka: DropdownProps = new DropdownProps();
  public ddMalzeme: DropdownProps = new DropdownProps();
  public ddProjeAlani: DropdownProps = new DropdownProps();
  public ddTasOcagi: DropdownProps = new DropdownProps();
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
    public kantarConfig: KantarConfig,
  ) {
    this.allData = this.allData.bind(this);
    DashboardComponent.componentInstance = this;
    if (this._electronService.ipcRenderer) {
      this._electronService.ipcRenderer.on('kantar', this.onDataKantar);
    }
  }

  ngOnInit(): void {
    this.initializeFormData();
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
      const arac = this.ddPlaka.list.find((x) => plaka.toUpperCase() == x.PlakaNo);
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
    const arac = this.ddPlaka.list.filter((x) => x.AracId == a)[0];
    if (!AppNetworkStatus.isOffline) {
      this.isLoading = true;
      const res = await this.ds.getNoMess(`${this.url}/api/Kantar/SonTasOcagiCikis?AracId=${arac.AracId}&ProjeId=${this.user.ProjeId}`);
      this.isLoading = false;
      this.formData.TasOcagiId = res.TasOcagiId;
      this.formData.TasOcagiGirisTarihi = res.TasOcagiGirisTarihi;
      this.formData.Latitude = res.Latitude;
      this.formData.Longitude = res.Longitude;
    }

    this.fillAracForm(arac);
  }

  async excel() {
    this.grid.saveAsExcel();
  }

  public allData(): ExcelExportData {
    var excelList = this.list;

    const result: ExcelExportData = process(excelList, {});

    return result;
  }

  public onExcelExport(e: ExcelExportEvent): void {
    // Access the workbook through e.workbook
    const workbook = e.workbook;

    if (workbook && workbook.sheets && workbook.sheets.length > 0) {
      const sheet = workbook.sheets[0];

      if (sheet.rows) {
        sheet.rows.forEach(row => {
          if (row.cells) {
            row.cells.forEach(cell => {
              // Check if the cell value is a Date
              if (cell.value instanceof Date) {
                cell.format = 'dd.mm.yyyy hh:mm';
              }
            });
          }
        });
      }
    }
  }

  public fillAracForm(arac) {
    if (arac != undefined && arac != null) {
      this.formData.AracId = arac.AracId;
      this.formData.Dara = arac.Dara;
      this.formData.FirmaAdi = arac.FirmaAdi;
      this.formData.FirmaId = arac.FirmaId;

      if (arac.DaraGuncellemeTarihi == null) return;
      var daraTarih = moment(arac.DaraGuncellemeTarihi);
      if (moment(new Date()).diff(daraTarih, 'days') > 1) Notiflix.Notify.warning("Lütfen aracın darasını güncelleyin! Son güncelleme tarihi : " + daraTarih.format("DD/MM/yyyy HH:mm"));

    }
  }

  public async BindForm() {
    this.user = JSON.parse(localStorage.getItem('user'));

    this.ddPlaka = new DropdownProps("PlakaNo", await this.ds.get(`${this.url}/api/AracList`));
    this.ddMalzeme = new DropdownProps("MalzemeTuru", await this.ds.get(`${this.url}/api/MalzemeTuruList`));
    this.ddTasOcagi = new DropdownProps("Adi", await this.ds.get(`${this.url}/api/Kantar/TasOcaklariMini?ProjeId=${this.user.ProjeId}`));
    this.ddProjeAlani = new DropdownProps("AlanAdi", await this.ds.get(`${this.url}/api/Kantar/ProjeAlanlari?ProjeId=${this.user.ProjeId}`));

  }

  public initializeFormData() {
    this.formData = {};
    for (const property in this.emptyFormData) this.formData[property] = this.emptyFormData[property];
  }

  public async BindGrid() {
    this.clearSelections();
    this.list = await this.ds.get(`${this.url}/api/KantarListV4?basTar=${moment(this.basTar).format('yyyy-MM-DD')}&bitTar=${moment(this.bitTar).add(1, 'days').format('yyyy-MM-DD')}&tanimKantarId=${this.kantarConfig.kantarId}`);

    this.view = process(this.list, this.state);
    this.total = aggregateBy(this.list, [{ field: 'NetTonaj', aggregate: 'sum' }]);
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.state = state;
    this.view = process(this.list, this.state);
  }

  public onCellClick(a) {
    this.selectedItem = a.dataItem;
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
    return { localData: context.dataItem.TartiNo == null, iadeData: context.dataItem.Iade == "Evet" };
  };

  public edit(a) {
    const modalRef = this.help.openModal(this.modalService, DokumEditComponent, "m");
    modalRef.componentInstance.dokum = a;
    modalRef.result.then((data) => {
      this.BindGrid();
    });
  }

  async save() {
    this.formData.TanimlarKantarId = this.kantarConfig.kantarId;
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
      this.initializeFormData();
      this.BindGrid();
    }
  }

  async daraGuncelle() {
    if (this.formData.AracId == null || this.formData.Tonaj == null || this.formData.Tonaj < 1) {
      Notiflix.Notify.failure('Araç ve ya tonaj bilgisi alınamadı!');
      return;
    }

    const arac = this.ddPlaka.list.filter((x) => x.AracId == this.formData.AracId)[0];

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
      this.initializeFormData();
      this.ddPlaka = new DropdownProps("PlakaNo", await this.ds.get(`${this.url}/api/AracList`));
    }
  }

  async iade() {
    if (this.formData.AracId == null || this.formData.Tonaj == null || this.formData.Tonaj < 1) {
      Notiflix.Notify.failure('Araç ve ya tonaj bilgisi alınamadı!');
      return;
    }
    const arac = this.ddPlaka.list.filter((x) => x.AracId == this.formData.AracId)[0];
    const willDelete = await Swal.fire({
      title: `${arac.PlakaNo} plakalı aracın ${this.formData.Tonaj} kg olan iadesini onaylıyor musunuz?`,
      type: 'warning',
      showCloseButton: false,
      showCancelButton: true,
      allowOutsideClick: false,
      cancelButtonText: 'Hayır',
      confirmButtonText: 'Evet',
    });
    if (willDelete.value != true) return;

    this.isLoading = true;
    this.formData.TanimlarKantarId = this.kantarConfig.kantarId;
    var result = await this.ds.put(`${this.url}/api/Iade?AracId=${this.formData.AracId}&TanimlarKantarId=${this.formData.TanimlarKantarId}&IadeTonaj=${this.formData.Tonaj}&IsIade=true`, "");
    this.isLoading = false;

    if (result.success) {
      this.initializeFormData();
      this.BindGrid();
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

class DropdownProps {
  list: any[] = [];
  f_list: any[] = [];
  displayField: string = "";

  constructor(displayField = "", list = []) {
    this.displayField = displayField;
    this.list = list;
    this.f_list = list;
  }

  onChange(keyword) {
    this.f_list = this.list.filter((x) => x[this.displayField].includes(keyword.toUpperCase()));
  }
}
