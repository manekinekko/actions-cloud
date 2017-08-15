import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-carousel",
  template: `
    <ng-content></ng-content>
  `,
  styles: [`
    :host {
      display: inline-block;
      width: 540px;
      margin: 10px;
    }
    ::ng-deep app-carousel {
      display: block;
    }
  `]
})
export class CarouselComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
