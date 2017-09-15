import { Subject } from "rxjs/Subject";
import { SessionService } from "./session.service";
import { MdSnackBar } from "@angular/material";
import { NotifierService } from "./notifier.service";
import { Injectable } from "@angular/core";
import {
  Step,
  OperationType,
  Operation,
  Status,
  Runnable,
  OnSessionExpired
} from "./gcp.types";

@Injectable()
export class GithubService implements Runnable, OnSessionExpired {
  onSessionExpired: Subject<boolean>;
  accessToken: string;
  operationSteps: Step[];
  notifier: NotifierService;

  constructor(public snackBar: MdSnackBar, public session: SessionService) {
    this.notifier = new NotifierService(snackBar).registerService(this);
    this.resetOperations();
    this.onSessionExpired = new Subject();
  }

  async run() {

    if (this.accessToken) {
      const forkOperation = await this.fork();

      if ((forkOperation as any).fork) {
        this.session.saveOperation("github", 0, forkOperation);
        return Promise.resolve(forkOperation);
      }
      return Promise.reject(false);
    } else {
      
      console.warn("Github Access Token is not set", this.accessToken);
      this.notifier.notify(null, false, false, {
        message: "Your Github account could not be linked."
      });

      return Promise.reject(false);
    }
  }

  resetOperations() {
    this.operationSteps = [
      // ForkingProject
      {
        enabled: true,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Forking project...`,
        description_2: `Project forked successfully.`
      }
    ];
  }

  // retore all valid operation from localStorage
  shouldRestoreOperations() {
    const storedOperationSteps = this.session.restoreOperation("github") as {
      [key: string]: Operation;
    }[];

    if (storedOperationSteps) {
      if (Object.keys(storedOperationSteps).length > 0) {
        for (const stepIndex in storedOperationSteps) {
          if (storedOperationSteps[stepIndex]) {
            this.restoreOperation(stepIndex);
          }
        }
      }
    }
  }

  // mark an operation as done based on its state from the localStorage
  restoreOperation(stepIndex: string) {
    this.operationSteps[stepIndex] = {
      enabled: true,
      isValid: true,
      isDirty: true,
      isWorking: false,
      description: this.operationSteps[stepIndex].description_2,
    } as Step;
  }

  isAllOperationsOK() {
    return this.operationSteps.every(s => s.isValid === true);
  }

  restoreToken() {
    this.accessToken = localStorage.getItem("github.access-token");
  }

  resetToken() {
    this.setToken(null);
  }

  setToken(accessToken) {
    if (accessToken) {
      this.accessToken = accessToken;
      localStorage.setItem(`github.access-token`, this.accessToken);
    }
    else {
      localStorage.removeItem(`github.access-token`);
    }
  }

  async fork() {
    this.notifier.notify(0, true, false);

    const fork: Operation = await this.fetch(
      `https://api.github.com/repos/actions-on-google-wizard/actions-on-google-project-template-gcp/forks`,
      {
        method: "POST"
      }
    );

    if (fork.message) {
      const error: Status = { message: fork.message };

      if (fork.message.indexOf("Bad credentials") !== -1) {
        error.code = 401;
      }

      this.notifier.notify(0, false, false, error);
    } else {
      this.notifier.notify(0, false, true);
    }

    return fork;
  }

  async fetch(url, opts = {} as any): Promise<{ [key: string]: string }> {
    console.info("[REQUESTING]", url);
    console.info(opts);

    if (opts.body) {
      opts.body = JSON.stringify(opts.body);
    }

    opts.headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Actions-on-Google-Wizard (by manekinekko)"
    };

    const f = await fetch(url, opts);
    const json = await f.json();
    console.info(json);

    return json;
  }
}
