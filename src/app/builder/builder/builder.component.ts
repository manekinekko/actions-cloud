import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import * as firebase from "firebase/app";
import { AngularFireAuth } from "angularfire2/auth";
import { HttpHeaders } from "@angular/common/http";

@Component({
  selector: "app-builder",
  templateUrl: "./builder.component.html",
  styleUrls: ["./builder.component.css"]
})
export class BuilderComponent {
  user: firebase.User;
  showDots: boolean;
  selectedCarousel: number;
  projectName: string;
  accessToken: {
    google: string;
  };
  error: {
    message: string
  };
  createdPorjectOperation: {
    done: boolean;
    error?: any;
  };
  isWorking: boolean;

  constructor(public afAuth: AngularFireAuth) {
    this.accessToken = {
      google: null
    };
    this.error = {
      message: ''
    };
    this.createdPorjectOperation = {
      done: null /* must be null for the initial state (see md-progress-bar) */
    };
    this.isWorking = false;

    afAuth.authState.subscribe(user => {
      this.user = user;
      console.log(user);

      if (user) {
        const storedIndex = parseInt(localStorage.getItem('ui.selectedCarousel'), 10);
        if (storedIndex) {
          this.next(storedIndex);
          this.showDots = true;
        }
        else {
          this.start();
        }
      } else {
        this.welcomeScreen();
      }
    });
  }

  ngOnInit() {
    this.accessToken.google = localStorage.getItem("accessToken.google");
  }

  welcomeScreen() {
    this.showDots = false;
    this.next(0);
    this.projectName = "";
    this.accessToken = {
      google: null
    };
  }

  start() {
    this.next(1);
    this.showDots = true;
  }

  next(index: number) {
    this.selectedCarousel = index;
    localStorage.setItem('ui.selectedCarousel', `${this.selectedCarousel}`);
  }

  async create() {
    
    this.isWorking = true;

    if (this.accessToken.google) {
      const createdPorject = await this.fetch('https://cloudresourcemanager.googleapis.com/v1/projects', {
        method: "POST",
        body: JSON.stringify({
          name: this.projectName,
          projectId: this.projectName,
          labels: {
            mylabel: this.projectName
          }
        })
      });
      this.isWorking = false;

      if (createdPorject.error) {
        this.error = createdPorject.error;
      }
      else if (createdPorject.name){
        this.error = {
          message: ''
        };

        this.isWorking = true; 
        setTimeout( async (_) => {
          this.createdPorjectOperation = await this.fetch(`https://cloudresourcemanager.googleapis.com/v1/${createdPorject.name}`);
          this.error = this.createdPorjectOperation.error;
          this.isWorking = false;
        }, 4000 );

      }

    } else {
      console.warn("Google Access Token is not set", this.accessToken.google);
    }
  }

  async login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/cloud-platform");
    provider.addScope("https://www.googleapis.com/auth/cloudplatformprojects");
    const loginInfo = await this.afAuth.auth.signInWithPopup(provider);
    this.accessToken.google = loginInfo.credential.accessToken;
    localStorage.setItem("accessToken.google", this.accessToken.google);
  }

  async logout() {
    await this.afAuth.auth.signOut();
    this.accessToken.google = null;
  }

  onTransition(index) {
    this.selectedCarousel = index;
    if (index === 0) {
      this.showDots = false;
    }
  }

  async fetch(url, opts = {}) {
    console.log('requesting', url);
    
    opts['headers'] = {
      "Authorization": `Bearer ${this.accessToken.google}`
    };

    try {
      const f = await fetch(url, opts);
      const r = await f.json();
      console.log(r);
      return r;
    }
    catch(e) {

    }
  }
}
