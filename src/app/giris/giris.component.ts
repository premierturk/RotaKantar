import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '../service/datasource';
import { GradientConfig } from '../app-config';
import { environment } from '../../environment';
import httpClient from '../service/http-client';
@Component({
  selector: 'app-giris',
  templateUrl: './giris.component.html',
  styleUrls: ['./giris.component.scss']
})
export class GirisComponent {
  public gradientConfig: any;
  constructor(
    public ds: DataSource,
    private router: Router,
  ) {
    this.gradientConfig = GradientConfig.config;
  }
  private url: string = environment.production ? environment.apiUrl : "/api";
  isLoading: boolean = false;
  public formData: any = {
    username: '',
    password: '',
    isMobile: false
  };

  async giris() {
    this.isLoading = true;
    const result = await this.ds.login(`${this.url}/token`, `grant_type=password&username=${this.formData.username}&password=${this.formData.password}`);
    this.isLoading = false;
    if (![null, undefined, "null"].includes(result.access_token)) {
      window.localStorage.setItem('user', JSON.stringify(result));
      httpClient.defaults.headers.common.Authorization = `Bearer ${result.access_token}`;
      this.router.navigate(["/dashboard"]);
    }
  }
}
