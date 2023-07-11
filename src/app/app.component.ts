import httpClient from './service/http-client';

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GradientConfig } from './app-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss',
    //"../scss/pdf-style/pdf-styles.css",
  ]
})
export class AppComponent implements OnInit {

  router: Router;

  constructor(private rout: Router, private route: ActivatedRoute, public httpClient: HttpClient) {
    this.router = rout;
  }



  ngOnInit() {


    // window.addEventListener('message', (event) => {
    //   if (event.data.toString().startsWith('user=')) {
    //     console.log("token geldi")
    //     const user = event.data.toString().replace('user=', '');
    //     window.localStorage.setItem('user', user);


    //     const strUser = window.localStorage.getItem('user');
    //     if (strUser !== null && strUser !== 'null') {
    //       const u: any = JSON.parse(strUser);

    //       httpClient.defaults.headers.common.Authorization = u.token;
    //       this.router.config[0].children[0].redirectTo = u.yetki[0].pageUrl;
    //     }




    //   }
    // }, false);

    // window.parent.postMessage('loaded', '*');
    // window.parent.postMessage('user', '*');

    // this.router.events.subscribe((evt) => {
    //   if (!(evt instanceof NavigationEnd)) {
    //     return;
    //   }
    //   window.scrollTo(0, 0);
    // });


    // const userStorage = JSON.parse(window.localStorage.getItem('user'));
    // if (userStorage == null || userStorage === 'null' || userStorage == undefined) {

    //   if (window.location.pathname == "/admin") {

    //     this.router.navigate(['admin'], { queryParams: { url: window.location.pathname } });
    //   }
    //   else if (window.location.pathname == "/sifredegistir")
    //     this.router.navigate(['sifredegistir'], { queryParams: { url: window.location.pathname } });
    //   else
    //     this.router.navigate(['giris'], { queryParams: { url: window.location.pathname } });


    // }
    // else {
    //   if (this.router.url == undefined || this.router.url == "/")
    //     debugger
    //   this.router.config[0].children[0].redirectTo = userStorage.yetki[0].pageUrl;

    // }

    // window.addEventListener('message', (event) => {
    //   if (event.data.toString().startsWith('user=')) {
    //     const user = JSON.parse(event.data.toString().replace('user=', ''));
    //     user.yetki = user.yetki.filter(x => x.applicationId == GradientConfig.config.appId)
    //     if (this.router.url == undefined || this.router.url == "/")
    //       this.router.config[0].children[0].redirectTo = user.yetki[0].pageUrl;

    //     window.localStorage.setItem('user', JSON.stringify(user));
    //     this.router.navigate([window.location.pathname]);
    //   }
    // }, false);


  }
}
