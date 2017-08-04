import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs/Observable";
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.css']
})
export class BuilderComponent {

  user: firebase.User;
  showDots: boolean;
  selectedCarousel: number;
  projectName: string;
  accessToken: {
    google: string
  };

  constructor(
    public afAuth: AngularFireAuth,
    public http: HttpClient
  ) {
    afAuth.authState.subscribe(user => {
      this.user = user;
      console.log(user);
      
      if (user) {
        this.start();
      }
      else {
        this.welcomeScreen();
      }
    })
    this.welcomeScreen();
  }

  welcomeScreen() {
    this.showDots = false;
    this.selectedCarousel = 0;
    this.projectName = '';
    this.accessToken = {
      google: null
    };
  }

  next(index: number) {
    this.selectedCarousel = index;
  }

  start() {
    this.selectedCarousel = 1;
    this.showDots = true;
  }

  async create() {
    if (this.accessToken.google) {
      this.http.post('https://cloudresourcemanager.googleapis.com/v1/projects', {
        "access_token": this.accessToken.google,
        "name": this.projectName,
        "projectId": this.projectName
      }).subscribe(response => console.log(response));
    }
    else {
      console.warn('Google Access Token is not set', this.accessToken.google);
    }
  }

  async login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/cloud-platform');
    provider.addScope('https://www.googleapis.com/auth/cloudplatformprojects');
    const loginInfo = await this.afAuth.auth.signInWithPopup(provider);
    this.accessToken.google = loginInfo.credential.accessToken;
    

  }

  async logout() {
    await this.afAuth.auth.signOut();
  }

  onTransition(index) {
    this.selectedCarousel = index;
    if (index === 0) {
      this.showDots = false;
    }
  }

}
