import { Status, Operation, ProjectBillingInfo } from "./gcp.service";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { MdSnackBar } from "@angular/material";

/************* TYPES *************/

export enum OperationType {
  CreatingProject,
  CheckingProjectAvailability,
  CheckingBilling,
  EnablingBilling,
  CreatingCloudRepository,
  CheckingPermissions,
  EnablingCloudFunctionService,
  CreatingCloudFunction,
  UploadingProjectTemplate
}

export enum LifecycleState {
  LIFECYCLE_STATE_UNSPECIFIED,
  ACTIVE,
  DELETE_REQUESTED,
  DELETE_IN_PROGRESS
}

export enum CloudFunctionStatus {
  STATUS_UNSPECIFIED,
  READY,
  FAILED,
  DEPLOYING,
  DELETING
}

export enum RoleLaunchStage {
  ALPHA,
  BETA,
  GA,
  DEPRECATED,
  DISABLED,
  EAP
}

export interface ProjectBillingInfo {
  name?: string;
  projectId?: string;
  billingAccountName?: string;
  billingEnabled?: boolean;
  error?: Status;
}

export interface BillingAccount {
  name?: string;
  open?: boolean;
  displayName?: string;
}

export interface BillingAccounts {
  billingAccounts?: Array<BillingAccount>;
  error?: Status;
}

export interface Repo {
  name?: string;
  size?: string;
  url?: string;
  mirrorConfig?: MirrorConfig;
  error?: Status;
}

export interface MirrorConfig {
  url?: string;
  webhookId?: string;
  deployKeyId?: string;
}

export interface Operation {
  name?: string;
  metadata?: {
    "@type"?: string;
  };
  done?: boolean;
  error?: Status;
  response?: {
    "@type"?: string;
  };
}

export interface Status {
  code?: number;
  status?: string;
  message?: string;
  details?: Array<{
    "@type": string;
    [name: string]: string;
  }>;
}

export interface Project {
  projectNumber?: string;
  projectId?: string;
  lifecycleState?: LifecycleState;
  name?: string;
  createTime?: string;
  labels?: {
    [name: string]: string;
  };
  parent?: ResourceId;
}

export interface ResourceId {
  type?: string;
  id?: string;
}

export interface Step {
  isValid?: boolean;
  isDirty?: boolean;
  isWorking?: boolean;
  description?: string;
  error?: string;
}

export interface CloudFunction {
  name?: string;
  status?: CloudFunctionStatus;
  latestOperation?: string;
  entryPoint?: string;
  timeout?: string;
  availableMemoryMb?: number;
  serviceAccount?: string;
  updateTime?: string;
  sourceArchiveUrl?: string;
  sourceRepository?: SourceRepository;
  httpsTrigger?: HTTPSTrigger;
  eventTrigger?: EventTrigger;
}

export interface HTTPSTrigger {
  url: string;
}

export interface EventTrigger {
  eventType?: string;
  resource?: string;
}

export interface SourceRepository {
  repositoryUrl?: string;
  sourcePath?: string;
  deployedRevision?: string;
  branch?: string;
  tag?: string;
  revision?: string;
}

export interface Role {
  name?: string;
  title?: string;
  description?: string;
  includedPermissions?: string[];
  stage?: RoleLaunchStage;
  etag?: string;
  deleted?: boolean;
  error?: Status;
}

export interface RoleRequest {
  roleId?: string;
  role?: Role;
}

/************* TYPES *************/

@Injectable()
export class GcpService {
  onSessionExpired: Subject<boolean>;
  operationSteps: Step[];

  accessToken: {
    google: string;
  };

  constructor(public snackBar: MdSnackBar) {
    this.accessToken = {
      google: null
    };

    this.onSessionExpired = new Subject();
    this.resetOperations();

    //@todo remove this
    this.__skipSteps(
      OperationType.CreatingProject,
      OperationType.EnablingBilling
    );
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
      // CreatingCloudRepository
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating Cloud Repository...`
      },
      // CheckingPermissions
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking permissions...`
      },
      // EnablingCloudFunctionService
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Enabling Cloud Function service...`
      },
      // CreatingCloudFunction
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating Cloud Function "agent"...`
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

  __skipSteps(from, to = null) {
    if (!to) {
      to = from;
    }
    this.operationSteps.map((step, key) => {
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

  guard(operation: Operation): boolean {
    const predicate = operation && !operation.error;

    console.log("[GUARD]", operation);

    return predicate;
  }

  /**
   * Start the creating process of the new project
   * 
   * @param projectId the project ID to create on the GCP
   */
  async createProjects(projectId: string) {
    if (this.accessToken.google) {
      //** just for initialization purpose!
      let createdPorject: Operation = { name: projectId };
      let checkedProject: Operation = { response: {} };
      let billingAccount: ProjectBillingInfo = {};
      let repoInfo: Repo = {};
      let projectBillingInfo: ProjectBillingInfo = {};
      let role: Role = {};
      let cloudFunctionServiceOperation: Operation = {};
      let cloudFunctionOperation: Operation = {};
      //**//

      // should we skip this step?
      if (this.operationSteps[OperationType.CreatingProject].isValid) {
        this.notify(
          OperationType.CreatingProject,
          false,
          true,
          null,
          `Project "${projectId}" created.`
        );
      } else {
        createdPorject = await this.createCloudProject(projectId);
      }

      // should we skip this step?
      if (
        this.operationSteps[OperationType.CheckingProjectAvailability].isValid
      ) {
        this.notify(
          OperationType.CheckingProjectAvailability,
          false,
          true,
          null,
          `Project "${createdPorject.name}" is ready.`
        );
      } else {
        checkedProject =
          this.guard(createdPorject) &&
          (await this.checkProjectAvailability(createdPorject));
      }

      // should we skip this step?
      if (this.operationSteps[OperationType.CheckingBilling].isValid) {
        this.notify(
          OperationType.CheckingBilling,
          false,
          true,
          null,
          `Found Billing account.`
        );
      } else {
        billingAccount =
          this.guard(checkedProject) && (await this.checkBilling());
      }

      // should we skip this step?
      if (this.operationSteps[OperationType.EnablingBilling].isValid) {
        this.notify(
          OperationType.EnablingBilling,
          false,
          true,
          null,
          `Enabled Billing for "${projectId}".`
        );
      } else {
        projectBillingInfo =
          this.guard(billingAccount) &&
          (await this.enablingBillingInfo(projectId, billingAccount));
      }

      // should we skip this step?
      if (this.operationSteps[OperationType.CreatingCloudRepository].isValid) {
        this.notify(
          OperationType.CreatingCloudRepository,
          false,
          true,
          null,
          `Created Cloud Repository for "${projectId}".`
        );
      } else {
        repoInfo =
          this.guard(projectBillingInfo) &&
          (await this.createCloudRepository(projectId));
      }

      // should we skip this step?
      if (this.operationSteps[OperationType.CheckingPermissions].isValid) {
        this.notify(
          OperationType.CheckingPermissions,
          false,
          true,
          null,
          `Permissions set for "${projectId}".`
        );
      } else {
        role =
          this.guard(repoInfo) &&
          (await this.checkCloudFunctionPermissions(projectId));
      }

      // should we skip this step?
      if (
        this.operationSteps[OperationType.EnablingCloudFunctionService].isValid
      ) {
        this.notify(
          OperationType.CheckingPermissions,
          false,
          true,
          null,
          `Enabled Cloud Function service for "${projectId}".`
        );
      } else {
        cloudFunctionServiceOperation =
          this.guard(role) &&
          (await this.enableCloudFunctionService(projectId));
      }

      // should we skip this step?
      if (this.operationSteps[OperationType.CreatingCloudFunction].isValid) {
        this.notify(
          OperationType.CheckingPermissions,
          false,
          true,
          null,
          `Created Cloud Function for "${projectId}".`
        );
      } else {
        cloudFunctionOperation =
          this.guard(cloudFunctionServiceOperation) &&
          (await this.createCloudFunction(projectId));
      }

      console.log(cloudFunctionOperation);
    } else {
      console.warn("Google Access Token is not set", this.accessToken.google);
    }

    return Promise.resolve(true);
  }

  /**
   * Request the creation of a GCP project.
   * 
   * @param projectId the project ID to create on the GCP
   */
  async createCloudProject(projectId: string) {
    this.notify(OperationType.CreatingProject, true, false);

    const createdPorject: Operation = await this.fetch(
      "https://cloudresourcemanager.googleapis.com/v1/projects",
      {
        method: "POST",
        body: {
          name: projectId,
          projectId: projectId,
          labels: {
            mylabel: projectId
          }
        } as Project
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

      this.notify(
        OperationType.CreatingProject,
        false,
        true,
        null,
        `Project "${projectId}" created.`
      );
    }

    return createdPorject;
  }

  /**
   * Check if the created project is available. Starts polling (1 second) and exits when the project is ready.
   * 
   * @param createdPorject The operation info received after starting created a new GCP project
   */
  async checkProjectAvailability(createdPorject: Operation) {
    return new Promise((resolve, reject) => {
      this.notify(OperationType.CheckingProjectAvailability, true, false);

      let projectAvailability = null;
      const stop = this.poll(async timer => {
        try {
          projectAvailability = await this.fetch(
            `https://cloudresourcemanager.googleapis.com/v1/${createdPorject.name}`
          );
          console.log(projectAvailability);

          if (projectAvailability.error) {
            this.notify(
              OperationType.CheckingProjectAvailability,
              false,
              false,
              projectAvailability.error
            );
            stop(timer);
            resolve(projectAvailability);
          } else if (projectAvailability.response) {
            this.notify(
              OperationType.CheckingProjectAvailability,
              false,
              true,
              null,
              `Project "${createdPorject.name}" is ready.`
            );
            stop(timer);
            resolve(projectAvailability);
          }
        } catch (e) {
          stop(timer);
          reject(e);
        }
      });
    });
  }

  /**
   * Retrieve the user's billing account information.
   */
  async checkBilling(): Promise<ProjectBillingInfo> {
    this.notify(OperationType.CheckingBilling, true, false);

    const billingAccountsResponse: BillingAccounts = await this.fetch(
      `https://cloudbilling.googleapis.com/v1/billingAccounts`
    );
    if (
      billingAccountsResponse.billingAccounts &&
      billingAccountsResponse.billingAccounts.length > 0
    ) {
      const account = billingAccountsResponse
        .billingAccounts[0] as BillingAccount;
      if (account) {
        const info: BillingAccount = await this.fetch(
          `https://cloudbilling.googleapis.com/v1/${account.name}`
        );
        if (info.open) {
          this.notify(
            OperationType.CheckingBilling,
            false,
            true,
            null,
            `Found Billing account "${account.displayName}".`
          );
          return Promise.resolve(account);
        }
      } else {
        console.warn("checkbilling::account is ", account);
      }
    } else {
      // error

      this.notify(
        OperationType.CheckingBilling,
        false,
        false,
        billingAccountsResponse.error
      );
      console.error(billingAccountsResponse.error);
    }

    return null;
  }

  /**
   * Enable the billing accound for the given project.
   * 
   * @param projectId The project ID to link with `billingAccountName`.
   * @param billingAccountName The billing account information received from `checkBilling()`.
   */
  async enablingBillingInfo(
    projectId: string,
    billingAccountName: ProjectBillingInfo
  ): Promise<ProjectBillingInfo> {
    this.notify(OperationType.EnablingBilling, true, false);

    const projectBillingInfo: ProjectBillingInfo = await this.fetch(
      `https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`,
      {
        method: "PUT",
        body: {
          billingAccountName: billingAccountName.name
        }
      }
    );

    if (projectBillingInfo.billingEnabled) {
      this.notify(
        OperationType.EnablingBilling,
        false,
        true,
        null,
        `Enabled Billing for "${projectId}".`
      );
      return projectBillingInfo;
    } else {
      this.notify(OperationType.EnablingBilling, false, false, {
        message: `Could not enable billing for "${projectId}".`
      });
      return null;
    }
  }

  async checkCloudFunctionPermissions(projectId: string): Promise<Role> {
    this.notify(OperationType.CheckingPermissions, true, false);

    const roleInfo: Role = await this.fetch(
      `https://iam.googleapis.com/v1/projects/${projectId}/roles`,
      {
        method: "POST",
        body: {
          roleId: "cloudfunctions.functions.create"
        } as RoleRequest
      }
    );

    if (roleInfo.etag) {
      // exemple:
      // roleInfo.name: "projects/aaaaaazzzzzzzzzzzzeeeeeeeee/roles/cloudfunctions.functions.create"
      // roleInfo.etag: BwVWCkmWyrY=
      this.notify(
        OperationType.CheckingPermissions,
        false,
        true,
        null,
        `Permissions set for "${projectId}".`
      );
    } else {
      // error

      this.notify(
        OperationType.CheckingPermissions,
        false,
        false,
        roleInfo.error
      );
    }

    return roleInfo;
  }

  /**
   * @notUsed
   */
  async undeleteRole(projectId: string): Promise<Role> {
    this.notify(OperationType.CheckingPermissions, true, false);

    const role = "cloudfunctions.functions.create";
    const etag = "BwVWCkmWyrY=";

    const roleInfo: Role = await this.fetch(
      `https://iam.googleapis.com/v1/projects/${projectId}/roles/${role}:undelete`,
      {
        method: "POST",
        body: {
          etag
        }
      }
    );

    return roleInfo;
  }

  /**
   * Enable the Cloud Function service (using Google Service Management).
   * 
   * @param projectId The project ID to link to this Cloud Function.
   */
  async enableCloudFunctionService(projectId) {
    return new Promise(async (resolve, reject) => {
      this.notify(OperationType.EnablingCloudFunctionService, true, false);

      const enableOperation: Operation = await this.fetch(
        `https://servicemanagement.googleapis.com/v1/services/cloudfunctions.googleapis.com:enable`,
        {
          method: "POST",
          body: {
            consumerId: `project:${projectId}`
          }
        }
      );

      let response;
      const stop = this.poll(async timer => {
        try {
          response = await this.fetch(
            `https://servicemanagement.googleapis.com/v1/${enableOperation.name}`
          );

          if (response.done) {
            stop(timer);
            this.notify(
              OperationType.EnablingCloudFunctionService,
              false,
              true,
              null,
              `Enabled Cloud Function service for "${projectId}".`
            );
            resolve(response);
          } else if (response.error) {
            stop(timer);
            this.notify(
              OperationType.EnablingCloudFunctionService,
              false,
              false,
              response.error
            );
            resolve(response);
          }
        } catch (e) {
          reject(e);
          stop(timer);
        }
      });
    });
  }

  /**
   * Create a new Clouf Function for the given project ID.
   * 
   * @param projectId The project ID to link with the new Cloud Function.
   */
  async createCloudFunction(projectId) {
    return new Promise(async (resolve, reject) => {
      this.notify(OperationType.CreatingCloudFunction, true, false);

      const locationId = `projects/${projectId}/locations/us-central1`;
      const entryPoint = "agent";

      const operation: Operation = await this.fetch(
        `https://cloudfunctions.googleapis.com/v1beta2/${locationId}/functions`,
        {
          method: "POST",
          body: {
            name: `${locationId}/functions/${entryPoint}`,
            entryPoint,
            timeout: "60s",
            availableMemoryMb: 256,
            sourceRepository: {
              repositoryUrl: `https://source.developers.google.com/p/${projectId}/r/default/`,
              sourcePath: "/",
              branch: "master"
            } as SourceRepository,
            httpsTrigger: {}
          } as CloudFunction
        }
      );

      if (operation.error) {
        this.notify(
          OperationType.CreatingCloudFunction,
          false,
          false,
          operation.error
        );
        resolve(operation);
      } else {
        // checking operation status

        let response;
        const stop = this.poll(async timer => {
          try {
            response = await this.fetch(
              `https://cloudfunctions.googleapis.com/v1beta2/${operation.name}`
            );
            console.log(response);
            if (response.error) {
              // error

              stop(timer);
              resolve(response);
              this.notify(
                OperationType.CreatingCloudFunction,
                false,
                false,
                response.error
              );
            } else if (response.done) {
              // success

              stop(timer);
              resolve(response);
              this.notify(
                OperationType.CreatingCloudFunction,
                false,
                false,
                null,
                `Creating Cloud Function "${entryPoint}"...`
              );
            }
          } catch (e) {
            reject(e);
            stop(timer);
          }
        });
      }
    });
  }

  async createCloudRepository(projectId: string) {

    this.notify(OperationType.CreatingCloudRepository, true, false);

    const repoInfo: Repo = await this.fetch(
      `https://sourcerepo.googleapis.com/v1/projects/${projectId}/repos`, {
        method: 'POST',
        body: {
          name: `projects/${projectId}/repos/default`,
          // mirrorConfig seems to be read only!!!
          // mirrorConfig: {
          //   url: 'https://github.com/actions-on-google-builder/actions-on-google-project-template.git'
          // }
        } as Repo
      }
    );
    console.log(repoInfo);

    if (repoInfo.error) {
      this.notify(OperationType.CreatingCloudRepository, false, false, repoInfo.error);
    }
    else {
      // success
      this.notify(OperationType.CreatingCloudRepository, false, true, null, `Created Cloud Repository for "${projectId}".`);
    }

    return repoInfo;
  }

  poll(callback: Function) {
    let timer = null;
    timer = setInterval(arg => {
      try {
        callback(timer);
      } catch (e) {
        clearInterval(timer);
      }
    }, 1000);
    return timer => {
      clearInterval(timer);
    };
  }

  notify(
    id: OperationType,
    isWorking: boolean,
    isValid: boolean,
    error: Status = null,
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

      if (
        error &&
        error.status &&
        error.status.indexOf("UNAUTHENTICATED") !== -1
      ) {
        // handle the session expired case

        snackBar = this.snackBar.open(
          "Session expired. You need to link your account again.",
          "CLOSE",
          {
            duration: 0
          }
        );
        this.onSessionExpired.next(true);
      } else {
        snackBar = this.snackBar.open(error.message, "CLOSE", {
          duration: 0
        });
      }
    } else {
      this.operationSteps[id].error = "";

      if (snackBar) {
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
