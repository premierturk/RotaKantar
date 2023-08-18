

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectronService } from 'ngx-electron';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss',
  ]
})
export class AppComponent implements OnInit {

  constructor(private rout: Router, private route: ActivatedRoute,
    private _electronService: ElectronService,) {
    if (this._electronService.ipcRenderer) {
      this._electronService.ipcRenderer.on('update_available', this.update);
    }
  }

  ngOnInit() {
    const userStorage = JSON.parse(window.localStorage.getItem('user'));
    if (userStorage == null || userStorage === 'null' || userStorage == undefined) {
      this.rout.navigate(['giris']);
    }
    else {
      if (this.rout.url == undefined || this.rout.url == "/")
        this.rout.config[0].children[0].redirectTo = "/dashboard";
    }
  }

  update() {
    Swal.fire('Güncelleme Mevcut', 'UYARI', 'warning');

  }
}
