import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataSource } from '../service/datasource';
import { GradientConfig } from '../app-config';
@Component({
  selector: 'app-giris',
  templateUrl: './giris.component.html',
  styleUrls: ['./giris.component.scss']
})
export class GirisComponent {
  isLoading: boolean = false;
  public formData: any = {
    username: '',
    password: '',
    isMobile: false
  };
  public gradientConfig: any;
  constructor(
    public ds: DataSource,
    private router: Router,
    private route: ActivatedRoute
  ) {

    this.gradientConfig = GradientConfig.config;
  }

  async giris() {
    //login 
    window.localStorage.setItem('user', JSON.stringify({ nameLastName: "Deniz Arda Murat" }));
    this.router.navigate(["/dashboard"]);
    console.log("Giris");
  }
}
