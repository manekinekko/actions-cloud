import { environment } from './../../../environments/environment.prod';
import { GcpService } from './../gcp.service';
import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs/Observable";
import * as firebase from "firebase/app";
import { AngularFireAuth } from "angularfire2/auth";

import * as generate from 'project-name-generator';

@Component({
  selector: "app-builder",
  templateUrl: "./builder.component.html",
  styleUrls: ["./builder.component.css"]
})
export class BuilderComponent {
  user: firebase.User;
  showDots: boolean;
  selectedCarousel: number;
  projectId: string;
  scopes: {uri: string; description: string}[];

  constructor(
    public afAuth: AngularFireAuth,
    public gcp: GcpService
  ) {
    
    this.scopes = environment.scopes;

    afAuth.authState.subscribe(user => {
      this.user = user;

      if (!user) {
        this.welcomeScreen();
      }
    });
  }

  ngOnInit() {
    this.projectId = 'aaaaaazzzzzzzzzzzzeeeeeeeee';
    this.gcp.restoreToken();
    this.gcp.onSessionExpired.subscribe( async(_) => {
      this.gcp.initiliaze();      
      await this.logout();
      this.next(1);
    });
    const storedIndex = parseInt(
      localStorage.getItem("ui.selectedCarousel"),
      10
    );
    this.next(storedIndex);

    if (storedIndex > 0) {
      this.showDots = true;
    }
  }

  randomProjectId() {
    if (!this.gcp.operationSteps[1].isValid) {
      this.projectId = generate({ words: 3, number: true }).dashed;
    }
  }

  welcomeScreen() {
    this.showDots = false;
    // this.projectId = "";
    this.gcp.resetToken();
    this.next(0);
  }

  start() {
    this.next(1);
    this.showDots = true;
  }

  next(index: number) {
    this.selectedCarousel = index;
    localStorage.setItem("ui.selectedCarousel", `${this.selectedCarousel}`);
  }

  async create() {
    const operation = await this.gcp.createProjects(this.projectId);
  }

  async login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    this.scopes.forEach(scope => provider.addScope(scope.uri));
    const loginInfo = await this.afAuth.auth.signInWithPopup(provider);
    this.gcp.setToken(loginInfo);
  }

  async logout() {
    await this.afAuth.auth.signOut();
    this.gcp.resetToken();
  }

  onTransition(index) {
    this.selectedCarousel = index;
    if (index === 0) {
      this.showDots = false;
    }
  }

}
