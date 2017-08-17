import { WizardComponent } from "./wizard/wizard/wizard.component";
import { WelcomeComponent } from "./welcome/welcome.component";

import { Routes } from "@angular/router";

export const routes: Routes = [{
  path: "", redirectTo: "welcome", pathMatch: "full"
}, {
  path: "welcome", component: WelcomeComponent
}, {
  path: "wizard", component: WizardComponent
}];
