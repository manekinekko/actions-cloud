import { SessionService } from './session.service';
import { NotifierService } from "./notifier.service";
import { GcpService } from "./gcp.service";
import { CarouselModule } from "./../_shared/carousel/carousel.module";
import { MatModule } from "./../_shared/mat/mat.module";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularFireModule } from "angularfire2";
import { environment } from "./../../environments/environment.prod";
import { BuilderComponent } from "./builder/builder.component";
import { AngularFireAuthModule } from "angularfire2/auth";
import { FormsModule } from "@angular/forms";
import { GithubService } from "./github.service";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatModule,
    CarouselModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule
  ],
  declarations: [BuilderComponent],
  exports: [BuilderComponent],
  providers: [GcpService, GithubService, NotifierService, SessionService]
})
export class BuilderModule { }
