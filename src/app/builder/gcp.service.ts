import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";

export enum OperationType {
  CreatingProject,
  CheckingProjectCreation
}

@Injectable()
export class GcpService {
  operations: Subject<{ error?: any; id: OperationType; isWorking: boolean }>;

  accessToken: {
    google: string;
  };

  constructor() {
    this.accessToken = {
      google: null
    };

    this.operations = new Subject();
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
    this.accessToken.google = loginInfo.credential.accessToken;
    localStorage.setItem("accessToken.google", this.accessToken.google);
  }

  async createProjects(projectName) {
    if (this.accessToken.google) {
      
      this.notify(OperationType.CreatingProject, true);
      const createdPorject = await this.createCloudFunction(projectName);
      
      if (createdPorject.error) {
        // error

        this.notify(OperationType.CreatingProject, false, createdPorject.error);

      } else if (createdPorject.name) {
        // success
        
        this.notify(OperationType.CheckingProjectCreation, true);
        await this.checkProjectCreation(createdPorject);
        this.notify(OperationType.CheckingProjectCreation, true);

      }
    } else {
      console.warn("Google Access Token is not set", this.accessToken.google);
    }


    return Promise.resolve(true);
  }

  async createCloudProject(projectName) {
    return  await this.fetch(
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
  }

  //@todo
  async checkProjectCreation(createdPorject) {

    const result = {};
    
    setTimeout(async function() {
      this.createdPorjectOperation = await this.fetch(
        `https://cloudresourcemanager.googleapis.com/v1/${createdPorject.name}`
      );
      this.createdPorjectOperation.error;

      const r = await this.createCloudFunction(this.projectName);
      console.log(r);
    }, 6000);

    return result;
  }

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

  notify(id: OperationType, isWorking: boolean, error: string = null) {
    this.operations.next({
      error,
      id,
      isWorking
    });
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
