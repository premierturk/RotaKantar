import { Injectable } from '@angular/core';
import { GridDataResult } from '@progress/kendo-angular-grid';

import { State, toDataSourceRequestString } from '@progress/kendo-data-query';
import Swal from 'sweetalert2';
import httpClient from '../service/http-client';
import { GeneralResponse } from './generalResponse';
import { DialogService } from '@progress/kendo-angular-dialog';
import { GradientConfig } from '../app-config';
import * as Notiflix from 'node_modules/notiflix/dist/notiflix-3.2.6.min.js';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
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
    this.dialogService.open({
      title: 'Hata oluştu',
      content: errorMessage,
      actions: [
        { text: 'Tamam', primary: true }
      ],
    }).result.subscribe(result => {
    });
  }

  checkpermission = (type: string) => {

    let yetki = JSON.parse(localStorage.getItem('user')).yetki.filter(a => a.pageUrl == this.router.routerState.snapshot.url);

    if (yetki.length < 1) {
      this.router.navigate(['maintenance/offline-ui'], { queryParams: { url: window.location.pathname } });
      return 0;
    } else {

      if (type == "read") {
        if (yetki[0].r == false) {
          this.router.navigate(['maintenance/offline-ui'], { queryParams: { url: window.location.pathname } });
        }
      }
      if (type == "create") {
        if (yetki[0].c == false) {
          this.router.navigate(['maintenance/offline-ui'], { queryParams: { url: window.location.pathname } });
        }
      }
      if (type == "update") {
        if (yetki[0].u == false) {
          this.router.navigate(['maintenance/offline-ui'], { queryParams: { url: window.location.pathname } });
        }
      }
      if (type == "delete") {
        if (yetki[0].d == false) {
          this.router.navigate(['maintenance/offline-ui'], { queryParams: { url: window.location.pathname } });
        }
      }
      if (type == "import") {
        if (yetki[0].i == false) {
          this.router.navigate(['maintenance/offline-ui'], { queryParams: { url: window.location.pathname } });
        }
      }
      if (type == "export") {
        if (yetki[0].e == false) {
          this.router.navigate(['maintenance/offline-ui'], { queryParams: { url: window.location.pathname } });
        }
      }

      return yetki[0];
    }



  }


  async getGridData(url: string, state: State, params: string = "") {
    this.loading = true;

    var page = this.checkpermission("read");

    const queryStr = `${toDataSourceRequestString(state)}`;
    const hasGroups = state.group && state.group.length;

    try {

      const resp = await httpClient.get<GridDataResult>(`${url}?${queryStr}${params}`, {
        headers: {
          // appId: GradientConfig.config.appId,
          pageUrl: page.pageUrl,
          pageKey: page.pageKey


        }
      })
      this.loading = false;
      return resp.data;

    } catch (err) {
      // Error handling here
      this.handleErrorResponse(err);
      return err;

    }
  }

  async post<T>(url: string, data: any) {

    var page = this.checkpermission("create");

    try {
      const resp = await httpClient.post<T>(url, data,
        {
          headers: {
            // appId: GradientConfig.config.appId,
            pageUrl: page.pageUrl,
            pageKey: page.pageKey
          }
        }
      );
      if (resp.status == 200) {
        Notiflix.Notify.success('Başarılı');
      }
      else {
        Notiflix.Notify.failure('Hata oluştu');
      }
      return resp.data;

    } catch (err) {
      // Error handling here
      this.handleErrorResponse(err);
      return err;

    }


  }

  async login<T>(url: string, data: any) {

    try {
      const resp = await httpClient.post<T>(url, data,
        {
          headers: {
            //appId: GradientConfig.config.appId,

          }
        }
      );
      if (resp.status == 200) {
        Notiflix.Notify.success('Hoşgeldiniz')

      }
      else {
        Notiflix.Notify.failure('Hata oluştu');
      }
      return resp.data;

    } catch (err) {
      // Error handling here
      this.handleErrorResponse(err);
      return err;

    }


  }

  async put<T>(url: string, data: any,) {

    var page = this.checkpermission("update");


    try {
      const resp = await httpClient.put<T>(url, data, {
        headers: {
          // appId: GradientConfig.config.appId,
          pageUrl: page.pageUrl,
          pageKey: page.pageKey
        }
      })
      if (resp.status == 200) {
        Notiflix.Notify.success('Başarılı');
      }
      else {
        Notiflix.Notify.failure('Hata oluştu');
      }
      return resp.data;

    } catch (err) {
      // Error handling here
      this.handleErrorResponse(err);
      return err;

    }
  }

  async putPublic<T>(url: string, data: any,) {


    try {
      const resp = await httpClient.put<T>(url, data)
      if (resp.status == 200) {
        Notiflix.Notify.success('Başarılı');
      }
      else {
        Notiflix.Notify.failure('Hata oluştu');
      }
      return resp.data;

    } catch (err) {
      // Error handling here
      this.handleErrorResponse(err);
      return err;

    }
  }

  async del(url: string) {

    var page = this.checkpermission("delete");
    const willDelete = await Swal.fire({
      title: 'Silmek istediğinizden emin misiniz?',
      icon: 'warning',
      showCloseButton: false,
      showCancelButton: true,
      allowOutsideClick: false,
      cancelButtonText: 'İptal',
      confirmButtonText: 'Tamam'
    });
    if (!willDelete.dismiss) {

      const resp = await httpClient.put(url, null, {
        headers: {
          // appId: GradientConfig.config.appId,
          pageUrl: page.pageUrl,
          pageKey: page.pageKey
        }
      }).then(function (response) {
        Notiflix.Notify.success('Başarılı şekilde silindi.');
        return response.data;
      })
        .catch(function (err) {


          var e = err.response.data;
          if (e && e.didError) {

            Notiflix.Notify.failure(e.errorMessage);
          } else
            Notiflix.Notify.failure("Lütfen silmek istediğiniz kaydın ilişkili kayıtları kontrol ediniz");
        })






    }
  }

  async get<T>(url: string) {

    var page = this.checkpermission("read");

    try {
      const resp = await httpClient.get<GeneralResponse>(url, {
        headers: {
          // appId: GradientConfig.config.appId,
          pageUrl: page.pageUrl,
          pageKey: page.pageKey
        }
      });
      const data = resp.data;
      if (data.didError) {
        this.showErrorModal(data.errorMessage);
        return undefined;
      } else {

        return (data.model as T);
      }

    } catch (err) {
      this.handleErrorResponse(err);
      return err;


    }

  }

  async getDs<T>(url: string, callback: (T) => void) {
    var page = this.checkpermission("read");


    try {
      const resp = await httpClient.get<GeneralResponse>(url, {
        headers: {
          //// appId: GradientConfig.config.appId,
          // pageUrl: page.pageUrl,
          // pageKey: page.pageKey
        }
      });
      const data = resp.data;
      if (data.didError) {
        this.showErrorModal(data.errorMessage);
        return undefined;
      } else {

        return (callback(data.model as T));
      }
    } catch (err) {
      this.handleErrorResponse(err);
      return err;


    }

  }


  handleErrorResponse(error: any) {

    let errorResponse;
    if (error.response && error.response.status) {
      // I expect the API to handle error responses in valid format
      if (error.response.status == "401") { // Unauthorized 
        this.router.navigate(['giris'], { queryParams: { url: window.location.pathname } });
        errorResponse = "Lütfen Tekrar Giriş Yapınız";
      }
      if (error.response.status == "400") {  //Bad Request

        errorResponse = "Giriş verilerini kontrol ediniz";

      } else if (error.response.status == "403") {  //Forbidden

        Notiflix.Notify.failure("Bu İşlemi Yapmak İçin Yetkiniz Yok");
        this.router.navigate(['maintenance/offline-ui']);

      } else if (error.response.status == "500") { //Server Error
        errorResponse = error.response.data.errorMessage;
        if (errorResponse == "Lütfen Şifrenizi Değiştirin") {
          this.router.navigate(['sifredegistir']);
        }



        if (errorResponse.InnerException) {
          errorResponse = "Beklenmedik bir hata oluştu";

        }

        if (errorResponse == "An error occurred while updating the entries. See the inner exception for details.")
          errorResponse = "Veri Bütünlüğü Sağlanamadı";


      }



      // JSON stringify if you need the json and use it later
    } else if (error.request) {
      // TO Handle the default error response for Network failure or 404 etc.,
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
  Ara
}
