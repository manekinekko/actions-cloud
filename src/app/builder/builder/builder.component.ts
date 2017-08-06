import { environment } from './../../../environments/environment.prod';
import { GcpService } from './../gcp.service';
import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs/Observable";
import * as firebase from "firebase/app";
import { AngularFireAuth } from "angularfire2/auth";

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
  scopes: string[];

  constructor(
    public afAuth: AngularFireAuth,
    public gcp: GcpService
  ) {
    
    this.scopes = environment.scopes;

    afAuth.authState.subscribe(user => {
      this.user = user;
      console.log(user);

      if (user) {
      } else {
        this.welcomeScreen();
      }
    });
  }

  ngOnInit() {
    this.projectName = 'aaaaaazzzzzzzzzzzzeeeeeeeee';
    this.gcp.restoreToken();
    this.gcp.onSessionExpired.subscribe( async(_) => {
      await this.logout();
      this.next(1);
    });
    const storedIndex = parseInt(
      localStorage.getItem("ui.selectedCarousel"),
      10
    );
    if (storedIndex) {
      this.next(storedIndex);
      this.showDots = true;
    }
  }

  welcomeScreen() {
    this.showDots = false;
    this.projectName = "";
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
    const operation = await this.gcp.createProjects(this.projectName);
  }

  async login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    this.scopes.forEach(scope => provider.addScope(scope));
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
