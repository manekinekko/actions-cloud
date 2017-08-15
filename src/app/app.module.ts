import { MatModule } from "./_shared/mat/mat.module";
import { BuilderModule } from "./builder/builder.module";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MatModule,
    BuilderModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
