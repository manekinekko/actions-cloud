import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MdToolbarModule, MdCardModule, MdButtonModule } from "@angular/material";
export const MdModules = [
  MdToolbarModule,
  MdCardModule,
  MdButtonModule
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
