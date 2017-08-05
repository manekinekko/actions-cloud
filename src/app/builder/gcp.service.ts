import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { MdSnackBar } from "@angular/material";

export enum OperationType {
  CreatingProject = 0,
  CheckingProjectCreation = 1,
  CheckingBilling = 2,
  CheckingPermissions = 3,
  CreatingCloudFunction = 4,
  CheckingCloudFunction = 5,
  UploadingProjectTemplate = 6
}

export interface Step {
  isValid: boolean;
  isDirty: boolean;
  isWorking: boolean;
  description: string;
  error?: string;
}

@Injectable()
export class GcpService {
  // operations: Subject<{ error?: any; id: OperationType; isWorking: boolean }>;
  operationSteps: Step[];

  accessToken: {
    google: string;
  };

  constructor(public snackBar: MdSnackBar) {
    this.accessToken = {
      google: null
    };

    this.operationSteps = [
      // CreatingProject
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating project...`
      },
      // CheckingProjectCreation
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking project...`
      },
      // CheckingBilling
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking billing...`
      },
      // CheckingPermissions
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking permissions...`
      },
      // CreatingCloudFunction
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating cloud function "agent"...`
      },
      // CheckingCloudFunction
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking cloud function...`
      },
      // UploadingProjectTemplate
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Uploading project template...`
      }
    ];

    // this.operations = new Subject();
  }

  restoreToken() {
    this.accessToken.google = localStorage.getItem("accessToken.google");
  }

  resetToken() {
    this.setToken(null);
    this.accessToken = {
      google: null
    };
  }

  setToken(loginInfo) {
    this.accessToken.google = loginInfo
      ? loginInfo.credential.accessToken
      : null;
    localStorage.setItem("accessToken.google", this.accessToken.google);
  }

  async createProjects(projectName) {
    if (this.accessToken.google) {
      const createdPorject = await this.createCloudProject(projectName);
      const checkedProject = !createdPorject.error && await this.checkProjectCreation(createdPorject);
      console.log(checkedProject);
      
      // const createdCloudFunction = await this.createCloudFunction(projectName);

    } else {
      console.warn("Google Access Token is not set", this.accessToken.google);
    }

    return Promise.resolve(true);
  }

  async createCloudProject(projectName) {
    this.notify(OperationType.CreatingProject, true, false);

    const createdPorject = await this.fetch(
      "https://cloudresourcemanager.googleapis.com/v1/projects",
      {
        method: "POST",
        body: {
          name: projectName,
          projectId: projectName,
          labels: {
            mylabel: projectName
          }
        }
      }
    );

    if (createdPorject.error) {
      // error

      this.notify(
        OperationType.CreatingProject,
        false,
        false,
        createdPorject.error
      );
      
    } else if (createdPorject.name) {
      // success

      this.notify(OperationType.CreatingProject, false, true);
    }

    return createdPorject;
  }

  //@todo
  async checkProjectCreation(createdPorject) {
    
    return new Promise( (resolve, reject) => {

      this.notify(OperationType.CheckingProjectCreation, true, false);

      let timer = null;
      let response = null;

      timer = setInterval( async (_) => {
        try {
          response = await this.fetch(
            `https://cloudresourcemanager.googleapis.com/v1/${createdPorject.name}`
          );

          if (response.error) {
            this.notify(OperationType.CheckingProjectCreation, false, false, response.error);
            clearInterval(timer);
            resolve(response);
          }
          else if (response.name) {
            this.notify(OperationType.CheckingProjectCreation, true, true);
            clearInterval(timer);
            resolve(response);
          }
        }
        catch(e){
            clearInterval(timer);
            reject(e);
        }

      }, 1000);

    });
  }

  //@todo
  async createCloudFunction(projectId) {
    const locationId = `projects/${projectId}/locations/us-central1`;
    return await this.fetch(
      `https://cloudfunctions.googleapis.com/v1beta2/${locationId}/functions`,
      {
        method: "POST",
        body: {
          name: `${locationId}/functions/agent`,
          entryPoint: "agent",
          timeout: "60s",
          availableMemoryMb: 256,
          sourceRepository: {
            repositoryUrl: `https://source.developers.google.com/p/${projectId}/r/default/`,
            sourcePath: "/",
            branch: "master"
          },
          httpsTrigger: {}
        }
      }
    );
  }

  notify(
    id: OperationType,
    isWorking: boolean,
    isValid: boolean,
    error: any = null
  ) {

    let snackBar = null;
    this.operationSteps[id].isDirty = true;
    this.operationSteps[id].isWorking = isWorking;
    this.operationSteps[id].isValid = isValid;

    if (error) {
      const errorMsg = `[${error.status}] ${error.message}`;
      this.operationSteps[id].error = error.status;

      snackBar = this.snackBar.open(error.message, "CLOSE", {
        duration: 0
      });
    }
    else {
      this.operationSteps[id].error = '';

      if (snackBar){
        snackBar.dismiss();
      }
    }
  }

  isAllOperationsOK() {
    return this.operationSteps.every(s => s.isValid === true);
  }

  async fetch(url, opts = {} as any) {
    console.log("requesting", url);

    if (opts.body) {
      opts.body = JSON.stringify(opts.body);
    }

    opts.headers = {
      Authorization: `Bearer ${this.accessToken.google}`
    };

    try {
      const f = await fetch(url, opts);
      const r = await f.json();
      console.log(r);
      return r;
    } catch (e) {
      console.error("fetch", e);
    }
  }
}
