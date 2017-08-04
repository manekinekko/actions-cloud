import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
  MdToolbarModule,
  MdCardModule,
  MdButtonModule,
  MdInputModule
} from "@angular/material";
export const MdModules = [
  BrowserAnimationsModule,
  MdToolbarModule,
  MdCardModule,
  MdButtonModule,
  MdInputModule
];

@NgModule({
  imports: [
    MdModules
  ],
  exports: [
    ...MdModules
  ],
  declarations: []
})
export class MatModule { }
