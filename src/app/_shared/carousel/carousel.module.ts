import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselComponent } from './carousel/carousel.component';
import { CarouselGroupComponent } from './carousel-group/carousel-group.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [CarouselComponent, CarouselGroupComponent],
  exports: [CarouselComponent, CarouselGroupComponent]
})
export class CarouselModule { }
