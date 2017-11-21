import { Component, OnInit } from "@angular/core";
import { SessionService } from "../wizard/session.service";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-welcome",
  templateUrl: "./welcome.component.html",
  styleUrls: ["./welcome.component.css"]
})
export class WelcomeComponent implements OnInit {
  hasBetaAccessCode: boolean;

  constructor(
    public session: SessionService,
    public route: ActivatedRoute,
    public router: Router
  ) {
    this.hasBetaAccessCode = false;
  }

  async ngOnInit() {
    this.route.queryParams.subscribe(p => {
      this.checkBetaAccess({
        email: p.email,
        token: p.token
      });

      this.router.navigate(["/welcome"]);
    });

    window.addEventListener("storage", e => {
      this.checkBetaAccess();
    });
  }

  async checkBetaAccess(opts?) {
    this.hasBetaAccessCode = await this.session.checkBetaAccess(opts);
  }
}
