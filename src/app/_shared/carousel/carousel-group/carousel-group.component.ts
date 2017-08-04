import { CarouselComponent } from './../carousel/carousel.component';
import {
  Component,
  OnInit,
  QueryList,
  ContentChildren,
  ViewChild,
  ElementRef,
  Renderer2,
  Input,
  Output,
  EventEmitter
} from "@angular/core";

@Component({
  selector: 'app-carousel-group',
  template: `
    <section #sectionRef>
      <ng-content select="app-carousel"></ng-content>
    </section>
    <ul *ngIf="showDots" ><li *ngFor="let item of carouselComponents; let i=index" [ngClass]="{ 'selected': selected === i }" ><span (click)="select(i)">&nbsp;</span></li></ul>
  `,
  styles: [`
    :host {
      display: block;
      overflow: hidden;
      width: 571px;
      margin: 0 auto;
    }
    :host section {
      display: flex;
      align-content: center;
      align-items: center;
      width: 3000px;
      overflow: hidden;
      padding: 5px;
      transition: transform 500ms cubic-bezier(0.250, 0.460, 0.450, 0.940);
    }
    @media (max-width: 600px) {
        :host section {
          height: 460px;
        }
    }
    :host ul {
      list-style: none;
      margin: 0;
      padding: 0;
      text-align: center;
    }
    :host li {
      display: inline-block;
      width: 10px;
      height: 10px;
      padding: 10px 1px;
    }
    :host li.selected span {
      background: rgba(89, 157, 240, 1);
    }
    :host li span {
      background: rgba(89, 157, 240, 0.5);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      cursor: pointer;
      display: block;
    }
  `]
})
export class CarouselGroupComponent implements OnInit {

  @ViewChild('sectionRef') sectionRef: ElementRef;
  @ContentChildren(CarouselComponent) carouselComponents: QueryList<CarouselComponent>;

  @Input() selected: number;
  @Input() showDots: boolean;

  @Output() transition: EventEmitter<number>;

  step: number;

  constructor(
    public r: Renderer2
  ) {
    this.step = 560;
    this.selected = 0;
    this.showDots = true;
    this.transition = new EventEmitter();
  }

  ngOnInit() {
  }

  ngAfterContentInit(){
    this.translate();
  }

  ngOnChanges(s) {
    if(s.selected) {
      this.translate();
    }
  }

  select(index:number) {
    if (index < this.carouselComponents.length) {
      this.selected = index;
      this.translate();
    }
    else {
      console.warn('CarouselGroupComponent::select', 'out of boundaries', index, this.carouselComponents.length);
    }
  }

  translate() {
    this.r.setStyle(this.sectionRef.nativeElement, 'transform', `translate(-${ this.selected * this.step }px)`);
    this.transition.emit(this.selected);
  }

}
