

import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectronService } from 'ngx-electron';
import Swal from 'sweetalert2';
import helper from 'src/app/service/helper';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UpdateModalComponent } from './update-modal/update-modal.component';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss',
  ]
})
export class AppComponent implements OnInit {
  static componentInstance: any;

  constructor(private rout: Router, private route: ActivatedRoute,
    private ref: ChangeDetectorRef,
    private _electronService: ElectronService,
    public help: helper,
    public modalService: NgbModal) {
    AppComponent.componentInstance = this;
    if (this._electronService.ipcRenderer) {
      this._electronService.ipcRenderer.on('update_available', this.update);
      this._electronService.ipcRenderer.on('print', this.printAll);
    }

  }
  printAll(event, data) {
    console.log(data);
  }

  update(event, data) {
    const modalRef = AppComponent.componentInstance.help.openModal(AppComponent.componentInstance.modalService, UpdateModalComponent);
    setTimeout(() => {
      UpdateModalComponent.componentInstance.ref.detectChanges();
    }, 2000);
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
}
