import { Component, OnInit } from '@angular/core';
import { Observable } from "rxjs/Observable";
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.css']
})
export class BuilderComponent {

  user: Observable<firebase.User>;
  showDots: boolean;
  selectedCarousel: number;

  constructor(
    public afAuth: AngularFireAuth
  ) {
    this.user = afAuth.authState;
    this.showDots = true;
    this.selectedCarousel = 0;
  }

  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  logout() {
    this.afAuth.auth.signOut();
  }

}
