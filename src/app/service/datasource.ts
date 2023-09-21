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

  showErrorModal(errorMessage) {
    this.dialogService
      .open({
        title: 'Hata oluştu',
        content: errorMessage,
        actions: [{ text: 'Tamam', primary: true }],
      })
      .result.subscribe((result) => {});
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
      const resp = await httpClient.post(url, data);
      var success = false;
      if (resp.status == 200) {
        success = true;
        Notiflix.Notify.success('Başarılı');
      } else {
        Notiflix.Notify.failure(data);
      }
      return { success: success, data: resp.data };
    } catch (err) {
      this.handleErrorResponse(err);
      return { success: success };
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
    let errorResponse;
    if (error.response && error.response.status) {
      if (error.response.status == '401') {
        // Unauthorized
        this.router.navigate(['giris'], {
          queryParams: { url: window.location.pathname },
        });
        errorResponse = 'Lütfen Tekrar Giriş Yapınız';
      }
      if (error.response.status == '400') {
        //Bad Request
        errorResponse = 'Giriş verilerini kontrol ediniz';
      } else if (error.response.status == '403') {
        //Forbidden
        Notiflix.Notify.failure('Bu İşlemi Yapmak İçin Yetkiniz Yok');
      } else if (error.response.status == '500') {
        //Server Error
        errorResponse = error.response.data.errorMessage;
        if (errorResponse.InnerException) {
          errorResponse = 'Beklenmedik bir hata oluştu';
        }
        if (
          errorResponse ==
          'An error occurred while updating the entries. See the inner exception for details.'
        )
          errorResponse = 'Veri Bütünlüğü Sağlanamadı';
      }
    } else if (error.request) {
      errorResponse = error.request.message || error.request.statusText;
    } else {
      errorResponse = error;
    }
    Notiflix.Notify.failure(errorResponse);
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
