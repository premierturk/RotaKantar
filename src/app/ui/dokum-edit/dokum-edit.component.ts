import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as Notiflix from 'node_modules/notiflix/dist/notiflix-3.2.6.min.js';
import { ButtonType, DataSource } from 'src/app/service/datasource';
import { environment } from 'src/environment';

@Component({
  selector: 'app-dokum-edit',
  templateUrl: './dokum-edit.component.html',
  styleUrls: ['./dokum-edit.component.scss']
})
export class DokumEditComponent implements OnInit {
  private url: string = environment.production ? environment.apiUrl : '/api';

  @Input() dokum;
  @Output() result: EventEmitter<any> = new EventEmitter();
  public user: any;
  public ButtonType = ButtonType;
  public isLoading: boolean = false;
  public formData: any = {};
  public dsMalzemeTur: Array<any> = [];
  public dsTasOcaklari: Array<any> = [];
  public dsProjeAlanlari: Array<any> = [];
  public f_dsMalzemeTur: Array<any> = [];
  public f_dsTasOcaklari: Array<any> = [];
  public f_dsProjeAlanlari: Array<any> = [];

  constructor(
    public activeModal: NgbActiveModal,
    private ds: DataSource,) {

  }

  ngOnInit(): void {
    //this.formData = structuredClone(this.dokum); 
    for (const property in this.dokum) this.formData[property] = this.dokum[property];

    this.BindForm();
  }
  public async BindForm() {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.dsMalzemeTur = await this.ds.get(`${this.url}/api/MalzemeTuruList`);
    this.handleFilterMalzeme('');
    this.dsTasOcaklari = await this.ds.get(`${this.url}/api/Kantar/TasOcaklariMini?ProjeId=${this.user.ProjeId}`);
    this.handleFilterTasOcak('');
    this.dsProjeAlanlari = await this.ds.get(`${this.url}/api/Kantar/ProjeAlanlari?ProjeId=${this.user.ProjeId}`);
    this.handleProjeAlanlari('');
  }

  public async save() {
    this.formData.KantarId = this.formData.TartiNo;
    var err = this.validations();
    if (err != '') {
      Notiflix.Notify.failure(err);
      return;
    }
    this.isLoading = true;
    var result = await this.ds.put(`${this.url}/api/Kantar`, this.formData);
    this.isLoading = false;

    if (result.success) {
      this.result.emit();
      this.activeModal.close();
    }
  }
  public validations() {
    var s = "";
    if (this.formData.MalzemeTipiId == null) s = 'Lütfen malzeme türü seçin.';
    else if (this.formData.ProjeAlaniId == null) s = 'Proje Alanı bulunamadı.';
    else if (this.formData.TasOcagiId == null) s = 'Taş ocağı bulunamadı.';
    return s;
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
  public close() {
    this.activeModal.close();

  }
}
