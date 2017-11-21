import { RouterModule } from "@angular/router";
import { SessionService } from "./session.service";
import { NotifierService } from "./notifier.service";
import { GcpService } from "./gcp.service";
import { CarouselModule } from "./../_shared/carousel/carousel.module";
import { MatModule } from "./../_shared/mat/mat.module";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularFireModule } from "angularfire2";
import { environment } from "./../../environments/environment.prod";
import { WizardComponent } from "./wizard/wizard.component";
import { AngularFireAuthModule } from "angularfire2/auth";
import { FormsModule } from "@angular/forms";
import { GithubService } from "./github.service";
import { BetaAccessService } from "../beta-access.service";
import { AngularFireDatabaseModule } from "angularfire2/database";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatModule,
    CarouselModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireDatabaseModule
  ],
  declarations: [WizardComponent],
  exports: [WizardComponent],
  providers: [
    GcpService,
    GithubService,
    NotifierService,
    SessionService,
    BetaAccessService
  ]
})
export class WizardModule {}
