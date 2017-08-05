import { ProjectBillingInfo, BillingAccount } from './gcp.service';
import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { MdSnackBar } from "@angular/material";

export enum OperationType {
  CreatingProject,
  CheckingProjectAvailability,
  CheckingBilling,
  EnablingBilling,
  CheckingPermissions,
  CreatingCloudFunction,
  CheckingCloudFunction,
  UploadingProjectTemplate,
}

export interface ProjectBillingInfo {
  name?: string;
  projectId?: string;
  billingAccountName?: string;
  billingEnabled?: boolean;
}

export interface BillingAccount {
  name: string;
  open: boolean;
  displayName: string;
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
  operations: Subject<Step[]>;
  operationSteps: Step[];

  accessToken: {
    google: string;
  };

  constructor(public snackBar: MdSnackBar) {
    this.accessToken = {
      google: null
    };

    this.operations = new Subject();
    this.resetOperations();
    
    //@todo remove this
    this.__skipSteps(0, 1);
  }

  resetOperations() {
    this.operationSteps = [
      // CreatingProject
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating project...`
      },
      // CheckingProjectAvailability
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking project availability...`
      },
      // CheckingBilling
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking billing...`
      },
      // EnablingBilling
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Enabling billing...`
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
  }

  __skipSteps(from, to=null) {
    if (!to) {
      to = from;
    }
    this.operationSteps
      .map((step, key) => {
        if (key >= from && key <= to) {
          step.isDirty = true;
          step.isValid = true;
        }
        return step;
      });
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

  async createProjects(projectId: string) {
    if (this.accessToken.google) {

      let createdPorject = {
        name: projectId
      } as any;

      let checkedProject = {
        response: {}
      } as any;

      // should we skip step 0?
      if (!this.operationSteps[0].isValid) {
        createdPorject = await this.createCloudProject(projectId);
      }
      
      // should we skip step 1?
      if (!this.operationSteps[1].isValid) {
        checkedProject = !createdPorject.error && await this.checkProjectAvailability(createdPorject);
      }

      const billingAccount = await this.checkBilling();
      const projectBillingInfo = this.enablingBillingInfo(projectId, billingAccount);
      console.log(billingAccount, projectBillingInfo);
      
      // const createdCloudFunction = await this.createCloudFunction(projectId);

    } else {
      console.warn("Google Access Token is not set", this.accessToken.google);
    }

    return Promise.resolve(true);
  }

  async createCloudProject(projectId) {
    this.notify(OperationType.CreatingProject, true, false);

    const createdPorject = await this.fetch(
      "https://cloudresourcemanager.googleapis.com/v1/projects",
      {
        method: "POST",
        body: {
          name: projectId,
          projectId: projectId,
          labels: {
            mylabel: projectId
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

      this.notify(OperationType.CreatingProject, false, true, null, `Project "${projectId}" created.`);
    }

    return createdPorject;
  }

  async checkProjectAvailability(createdPorject) {
    
    return new Promise( (resolve, reject) => {

      this.notify(OperationType.CheckingProjectAvailability, true, false);

      let timer = null;
      let projectAvailability = null;

      timer = setInterval( async (_) => {
        
        try {
          projectAvailability = await this.fetch(
            `https://cloudresourcemanager.googleapis.com/v1/${createdPorject.name}`
          );
          console.log(projectAvailability);
          

          if (projectAvailability.error) {
            this.notify(OperationType.CheckingProjectAvailability, false, false, projectAvailability.error);
            clearInterval(timer);
            resolve(projectAvailability);
          }
          else if (projectAvailability.response) {
            this.notify(OperationType.CheckingProjectAvailability, false, true, null, `Project "${createdPorject.name} is ready."`);
            clearInterval(timer);
            resolve(projectAvailability);
          }

        }
        catch(e){
            clearInterval(timer);
            reject(e);
        }

      }, 1000);

    });
  }

  async checkBilling(): Promise<ProjectBillingInfo> {

    this.notify(OperationType.CheckingBilling, true, false);

    const response = await this.fetch(`https://cloudbilling.googleapis.com/v1/billingAccounts`);
    if (response.billingAccounts && response.billingAccounts.length > 0) {
      
      const account = response.billingAccounts[0] as BillingAccount;
      if (account) {
        const info = await this.fetch(`https://cloudbilling.googleapis.com/v1/${account.name}`);
        if (info.open) {
          this.notify(OperationType.CheckingBilling, false, true, null, `Found Billing account "${account.displayName}".`);
          return Promise.resolve(account);
        }
        
      }
      
    }
    else {
      this.notify(OperationType.CheckingBilling, false, false, {message:'No billing account found. Please create a billing account first and try again.'});
      console.error('No billing account found. Please create a billing account first and try again.');
    }

    return null;
  }

  async enablingBillingInfo(projectId: string, billingAccountName: ProjectBillingInfo): Promise<ProjectBillingInfo> {
    this.notify(OperationType.EnablingBilling, true, false);
    
    const projectBillingInfo: ProjectBillingInfo = await this.fetch(`https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`, {
      method: 'PUT',
      body: {
        billingAccountName: billingAccountName.name
      }
    });

    if (projectBillingInfo.billingEnabled) {
      this.notify(OperationType.EnablingBilling, false, true, null, `Enabled Billing for "${projectId}".`);
      return projectBillingInfo;
    }
    else {
      this.notify(OperationType.EnablingBilling, false, false, `Could not enable billing for "${projectId}".`);
      return null;
    }

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
    error: any = null,
    description: string = null
  ) {

    let snackBar = null;
    this.operationSteps[id].isDirty = true;
    this.operationSteps[id].isWorking = isWorking;
    this.operationSteps[id].isValid = isValid;

    if (description) {
      this.operationSteps[id].description = description;
    }

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
        // snackBar.dismiss();
        snackBar.afterDismissed().subscribe(() => {
          this.resetOperations();
        });
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
