import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import {
  MatToolbarModule,
  MatCardModule,
  MatButtonModule,
  MatInputModule,
  MatProgressBarModule,
  MatListModule,
  MatProgressSpinnerModule,
  MatIconModule,
  MatSnackBarModule,
  MatExpansionModule
} from "@angular/material";

export const MdModules = [
  BrowserAnimationsModule,
  MatToolbarModule,
  MatCardModule,
  MatButtonModule,
  MatInputModule,
  MatProgressBarModule,
  MatListModule,
  MatProgressSpinnerModule,
  MatIconModule,
  MatSnackBarModule,
  MatExpansionModule
];

@NgModule({
  imports: [MdModules],
  exports: [...MdModules],
  declarations: []
})
export class MatModule {}
