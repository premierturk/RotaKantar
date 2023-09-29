import { Injectable } from '@angular/core';
import httpClient from '../service/http-client';
import { DialogService } from '@progress/kendo-angular-dialog';
import { GradientConfig } from '../app-config';
import * as Notiflix from 'node_modules/notiflix/dist/notiflix-3.2.6.min.js';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class DataSource {
  public gradientConfig: any;
  router: Router;
  public loading: boolean;

  constructor(private dialogService: DialogService, private rout: Router) {
    this.gradientConfig = GradientConfig.config;
    this.router = rout;
    Notiflix.Notify.init({});
  }

  async login(url: string, data: any) {
    try {
      const resp = await httpClient.post(url, data);
      if (resp.status == 200) {
        Notiflix.Notify.success('Hoşgeldiniz');
      } else {
        Notiflix.Notify.failure('Hata oluştu');
      }

      return resp.data;
    } catch (err) {
      this.handleErrorResponse(err);
      return err;
    }
  }

  async get(url: string) {
    try {
      const resp = await httpClient.get(url);

      if (resp.status == 200) {
      } else {
        Notiflix.Notify.failure('Hata oluştu');
      }

      return resp.data;
    } catch (err) {
      this.handleErrorResponse(err);
      return err;
    }
  }

  async post(url: string, data: any) {
    try {
      var success = false;
      const resp = await httpClient.post(url, data);
      if (resp.status == 200) {
        success = true;
        Notiflix.Notify.success('Başarılı');
      } else {
        Notiflix.Notify.failure(data);

      }
      return { success: success, data: resp.data };
    } catch (err) {
      return { success: false };
    }
  }

  async put(url: string, data: any) {
    try {
      const resp = await httpClient.put(url, data);
      if (resp.status == 200) {
        Notiflix.Notify.success('Başarılı');
      } else {
        Notiflix.Notify.failure('Hata oluştu');
      }
      return resp.data;
    } catch (err) {
      this.handleErrorResponse(err);
      return err;
    }
  }

  async delete(url: string) {
    try {
      const resp = await httpClient.delete(url);
      if (resp.status == 200) {
        Notiflix.Notify.success('Başarılı');
      } else {
        Notiflix.Notify.failure('Hata oluştu');
      }

      return resp.data;
    } catch (err) {
      this.handleErrorResponse(err);
      return err;
    }
  }

  handleErrorResponse(error: any) {
    if (error.response && error.response.status) {
      if (error.response.status == '401') {
        this.router.navigate(['giris'], {
          queryParams: { url: window.location.pathname },
        });
        Notiflix.Notify.failure('Lütfen Tekrar Giriş Yapınız');
      }
    }
  }

}

export enum ButtonType {
  Yeni,
  Duzenle,
  Sil,
  Excel,
  Pdf,
  Kaydet,
  Kapat,
  Dogrula,
  Ara,
}
