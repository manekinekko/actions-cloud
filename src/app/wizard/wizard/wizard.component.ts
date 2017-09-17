import { Operation, Status } from './../gcp.types';
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
  templateUrl: "./wizard.component.expansion.html",
  styleUrls: ["./wizard.component.css"]
})
export class WizardComponent implements OnInit {
  user: {
    google: any;
    github: any;
  };
  isStepEnabled: any[];
  selectedStep: number;
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

    this.isStepEnabled = Array(6).fill({ state: false });
    this.scopes = environment.scopes;
    this.selectedStep = 0;
    this.user = {
      google: null,
      github: null
    };
  }

  ngOnInit() {

    this.projectId = this.session.restoreGCPProjectId();

    this.gcp.restoreToken();
    this.github.restoreToken();

    this.github.shouldRestoreOperations();

    this.user.google = this.session.getUserInfo("google");
    this.user.github = this.session.getUserInfo("github");

    this.github.onSessionExpired.subscribe(async _ => {
      this.user.github = null;
      this.github.resetOperations();
      this.github.resetToken();
      this.setStep(0);
    });

    this.gcp.onSessionExpired.subscribe(async _ => {
      this.user.google = null;
      this.gcp.resetOperations();
      this.gcp.resetToken();
      this.setStep(3);
    });

    // restore panel index
    const storedIndex = parseInt(
      localStorage.getItem("ui.selected-carousel") || "0",
      10
    );
    if (this.isStepEnabled[storedIndex]) {
      this.setStep(storedIndex);
    }

    // restore github project info
    const github = this.session.restoreOperation<any>('github');
    if (github && github["0"] && github["0"].url && this.user.github) {
      this.user.github.project = github["0"];
    }

    const google = this.session.restoreOperation<any>('google');
    if (google && google["7"] && google["7"].url && this.user.google) {
      this.user.google.project = google["7"];
    }

    this.initStepsState();

    this.gcp.restoreOperations();
  }

  setStep(index: number) {
    this.selectedStep = index;
    localStorage.setItem("ui.selected-carousel", `${index}`);
  }

  nextStep() {
    this.selectedStep++;
  }

  prevStep() {
    this.selectedStep--;
  }

  initStepsState() {
      if (this.user.github) {
        this.setStepsState([0, 1], true);
        const op = this.session.restoreOperation<any>('github');
        if (op && op["0"]) {
          this.setStepsState([2], true);
        }
      }
      else {
        this.setStepsState([0], true);
      }
      
      if (this.user.google) {
        this.setStepsState([2,3,4], true);
      }
  }

  checkStepState(step: number) {
    return this.isStepEnabled[step].state;
  }

  checkNextStepState() {
    return this.isStepEnabled[this.selectedStep].state;
  }

  setStepsState(steps: number[], state: boolean) {
    for(let i=0; i<steps.length; i++) {
      if (i < this.isStepEnabled.length && this.isStepEnabled[i]) {
        this.isStepEnabled[ steps[i] ] = {state};
      }
    }
  }

  randomProjectId() {
    if (!this.gcp.operationSteps[1].isValid) {
      this.projectId = generate({ words: 3, number: true }).dashed;
    }
  }


  async forkGithubProject() {
    try {
      const operation = await this.github.run();
      this.user.github.project = operation;
      this.setStepsState([2], true);
    }
    catch(e) {
      this.setStep(0);
    }
  }

  async createGCPProjects() {
    try {
      const operation = await this.gcp.run(this.projectId);
      this.user.google.project = this.session.restoreOperation('google')['0'];
      this.setStepsState([3], true);
      this.nextStep();
    }
    catch(e) {
      console.log(e);
      if (e && e.status === "UNAUTHENTICATED" || e.status === "NO_ACCESS_TOKEN") {
        this.setStep(2);
      }
    }
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

        this.setStepsState([2, 3], true);
        this.nextStep();

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

        this.setStepsState([0, 1], true);
        this.nextStep();

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
        this.setStepsState([3,4], false);
        this.setStep(2);
        break;

      case Providers.GITHUB:
        this.user.github = null;
        this.session.setUserInfo("github", null);
        this.setStepsState([0], true);
        this.setStepsState([1,2,3,4], false);
        this.setStep(0);
        break;
    }
  }
}
