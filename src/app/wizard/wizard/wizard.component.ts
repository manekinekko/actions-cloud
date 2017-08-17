import { SessionService } from "./../session.service";
import { GithubService } from "./../github.service";
import { environment } from "./../../../environments/environment.prod";
import { GcpService } from "./../gcp.service";
import { Component, OnInit } from "@angular/core";
import * as firebase from "firebase/app";
import { AngularFireAuth } from "angularfire2/auth";
import * as generate from "project-name-generator";

export enum Providers {
  GOOGLE = "GOOGLE",
  GITHUB = "GITHUB"
}

@Component({
  selector: "app-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.css"]
})
export class WizardComponent implements OnInit {
  user: {
    google: any;
    github: any;
  };
  showDots: boolean;
  selectedCarousel: number;
  projectId: string;
  scopes: {
    google: { name: string; description: string }[];
    github: { name: string; description: string }[];
  };

  constructor(
    public afAuth: AngularFireAuth,
    public gcp: GcpService,
    public github: GithubService,
    public session: SessionService
  ) {

    this.scopes = environment.scopes;
    this.user = {
      google: null,
      github: null
    };
  }

  ngOnInit() {

    this.projectId = "aaaaaazzzzzzzzzzzzeeeeeeeee";

    this.gcp.restoreToken();
    this.github.restoreToken();

    this.github.shouldRestoreOperations();

    this.user.google = this.session.getUserInfo("google");
    this.user.github = this.session.getUserInfo("github");

    this.gcp.onSessionExpired.subscribe(async _ => {
      this.user.google = null;
      this.gcp.resetOperations();
      this.gcp.resetToken();
      this.next(3);
    });

    this.github.onSessionExpired.subscribe(async _ => {
      this.user.github = null;
      this.github.resetOperations();
      this.github.resetToken();
      this.next(1);
    });

    // restore carousel index
    const storedIndex = parseInt(
      localStorage.getItem("ui.selected-carousel") || "0",
      10
    );

    if (storedIndex > 0) {
      this.showDots = true;
    }
    this.next(storedIndex);
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
    this.github.resetToken();
    this.next(0);
  }

  start() {
    this.next(1);
    this.showDots = true;
  }

  next(index: number) {
    this.selectedCarousel = index;
  }

  async forkGithubProject() {
    const operation = await this.github.run();
  }

  async createGCPProjects() {
    const operation = await this.gcp.run(this.projectId);
  }

  async link(withProvider) {
    switch (withProvider) {
      case Providers.GOOGLE:
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        this.scopes.google.forEach(scope =>
          googleProvider.addScope(scope.name)
        );
        const google = await this.afAuth.auth.signInWithPopup(googleProvider);
        this.user.google = google.additionalUserInfo.profile;

        this.session.setUserInfo("google", this.user.google);
        this.gcp.setToken(google.credential.accessToken);
        console.log(google);
        break;

      case Providers.GITHUB:
        const githubProvider = new firebase.auth.GithubAuthProvider();
        this.scopes.github.forEach(scope =>
          githubProvider.addScope(scope.name)
        );
        const github = await this.afAuth.auth.signInWithPopup(githubProvider);
        this.user.github = github.additionalUserInfo.profile;

        this.session.setUserInfo("github", this.user.github);
        this.github.setToken(github.credential.accessToken);
        console.log(github);
        break;
    }
  }

  async unlink(withProvider: string) {
    await this.afAuth.auth.signOut();

    switch (withProvider) {
      case Providers.GOOGLE:
        this.user.google = null;
        this.session.setUserInfo("google", null);
        break;

      case Providers.GITHUB:
        this.user.github = null;
        this.session.setUserInfo("github", null);
        break;
    }
  }

  onTransition(index) {
    this.selectedCarousel = index;
    localStorage.setItem("ui.selected-carousel", `${this.selectedCarousel}`);
    if (index === 0) {
      this.showDots = false;
    }
  }
}
