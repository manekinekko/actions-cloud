import { Component, OnInit } from '@angular/core';
import { SessionService } from "../wizard/session.service";

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  
  hasBetaAccessCode: boolean;

  constructor(
    public session: SessionService
  ) {
    this.hasBetaAccessCode = false;
  }

  async ngOnInit() {
    window.addEventListener('storage', e => {
      this.checkBetaAccess();
    });
  }

  async checkBetaAccess() {
    this.hasBetaAccessCode = await this.session.checkBetaAccess();
  }

}
