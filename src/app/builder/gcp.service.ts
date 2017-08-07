import {
  Operation,
  ProjectBillingInfo,
  Repo,
  TransferJob,
  Step,
  OperationType,
  Project,
  BillingAccounts,
  BillingAccount,
  RoleRequest,
  SourceRepository,
  CloudFunction,
  BucketResource,
  TransferJobStatus,
  Status,
  Role,
  GoogleServiceAccount,
  IamPolicy
} from "./gcp.types";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { MdSnackBar } from "@angular/material";

const BUCKET_NAME = "bucket";
const CLOUD_FUNCTION_ENTRYPOINT = "agent";

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

    this.initiliaze();
  }

  initiliaze() {
    this.resetOperations();

    //@todo remove this
    this.__skipSteps(
      OperationType.CreatingProject,
      OperationType.CheckingProjectAvailability
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
        description: `Creating project...`,
        description_2: `Project created.`
      },
      // CheckingProjectAvailability
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking project availability...`,
        description_2: `Project is ready.`
      },
      // CheckingBilling
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking billing...`,
        description_2: `Found Billing account.`
      },
      // EnablingBilling
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Enabling billing...`,
        description_2: `Enabled Billing for project.`
      },
      // CreatingCloudBucket
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating Cloud Bucket...`,
        description_2: `Created Cloud Bucket.`
      },
      // EnablePermissionsForGCPDataSink
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Granting write permissions for GCP Data Sink...`,
        description_2: `Granted write permissions for bucket.`
      },
      // UploadingProjectTemplate
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Uploading project template...`,
        description_2: `Uploaded Project template to bucket.`
      },
      // CreatingCloudRepository
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating Cloud Repository...`,
        description_2: `Created Cloud Repository.`
      },
      // CheckingCloudFunctionPermissions
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Granting permissions to use Cloud Functions...`,
        description_2: `Granted permissions fro Cloud Functions.`
      },
      // EnablingCloudFunctionService
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Enabling Cloud Function service...`,
        description_2: `Enabled Cloud Function service.`
      },
      // CreatingCloudFunction
      {
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating Cloud Function "agent"...`,
        description_2: `Created Cloud Function.`
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

    console.groupCollapsed("[GUARD]");
    console.log(operation);
    console.groupEnd();

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
      let cloudBucketInfo: Operation = {};
      let projectBillingInfo: ProjectBillingInfo = {};
      let role: Role = {};
      let cloudFunctionServiceOperation: Operation = {};
      let cloudFunctionOperation: Operation = {};
      let transferJobOperation: TransferJob = {};
      let dataSinkPermissions: IamPolicy = {};
      //**//

      if (this.shouldSkip(OperationType.CreatingProject)) {
        this.notify(
          OperationType.CreatingProject,
          false,
          true
        );
      } else {
        createdPorject = await this.createCloudProject(projectId);
        this.saveSession(OperationType.CreatingProject, createdPorject);
      }

      if (this.shouldSkip(OperationType.CheckingProjectAvailability)) {
        this.notify(
          OperationType.CheckingProjectAvailability,
          false,
          true
        );
      } else {
        checkedProject =
          this.guard(createdPorject) &&
          (await this.checkProjectAvailability(createdPorject));
        this.saveSession(
          OperationType.CheckingProjectAvailability,
          createdPorject
        );
      }

      if (this.shouldSkip(OperationType.CheckingBilling)) {
        this.notify(
          OperationType.CheckingBilling,
          false,
          true
        );
      } else {
        billingAccount =
          this.guard(checkedProject) && (await this.checkBilling());
        this.saveSession(OperationType.CheckingBilling, billingAccount);
      }

      if (this.shouldSkip(OperationType.EnablingBilling)) {
        this.notify(
          OperationType.EnablingBilling,
          false,
          true
        );
      } else {
        projectBillingInfo =
          this.guard(billingAccount) &&
          (await this.enablingBillingInfo(projectId, billingAccount));
        this.saveSession(OperationType.EnablingBilling, projectBillingInfo);
      }

      if (this.shouldSkip(OperationType.CreatingCloudBucket)) {
        this.notify(
          OperationType.CreatingCloudBucket,
          false,
          true
        );
      } else {
        cloudBucketInfo =
          this.guard(projectBillingInfo) &&
          (await this.createCloudBucket(projectId));
        this.saveSession(OperationType.CreatingCloudBucket, cloudBucketInfo);
      }

      if (this.shouldSkip(OperationType.EnablePermissionsForGCPDataSink)) {
        this.notify(
          OperationType.EnablePermissionsForGCPDataSink,
          false,
          true
        );
      } else {
        dataSinkPermissions =
          this.guard(cloudBucketInfo) &&
          (await this.enablePermissionsForDataSink(projectId));
        this.saveSession(
          OperationType.EnablePermissionsForGCPDataSink,
          dataSinkPermissions
        );
      }

      if (this.shouldSkip(OperationType.UploadingProjectTemplate)) {
        this.notify(
          OperationType.UploadingProjectTemplate,
          false,
          true
        );
      } else {
        transferJobOperation =
          this.guard(cloudBucketInfo) &&
          (await this.createTransferJob(projectId));
        this.saveSession(
          OperationType.UploadingProjectTemplate,
          transferJobOperation
        );
      }

      if (this.shouldSkip(OperationType.CreatingCloudRepository)) {
        this.notify(
          OperationType.CreatingCloudRepository,
          false,
          true
        );
      } else {
        repoInfo =
          this.guard(transferJobOperation) &&
          (await this.createCloudRepository(projectId));
        this.saveSession(OperationType.CreatingCloudRepository, repoInfo);
      }

      if (this.shouldSkip(OperationType.CheckingCloudFunctionPermissions)) {
        this.notify(
          OperationType.CheckingCloudFunctionPermissions,
          false,
          true
        );
      } else {
        role =
          this.guard(repoInfo) &&
          (await this.checkCloudFunctionPermissions(projectId));
        this.saveSession(OperationType.CheckingCloudFunctionPermissions, role);
      }

      if (this.shouldSkip(OperationType.EnablingCloudFunctionService)) {
        this.notify(
          OperationType.EnablingCloudFunctionService,
          false,
          true
        );
      } else {
        cloudFunctionServiceOperation =
          this.guard(role) &&
          (await this.enableCloudFunctionService(projectId));
        this.saveSession(
          OperationType.EnablingCloudFunctionService,
          cloudFunctionServiceOperation
        );
      }

      if (this.shouldSkip(OperationType.CreatingCloudFunction)) {
        this.notify(
          OperationType.CreatingCloudFunction,
          false,
          true
        );
      } else {
        cloudFunctionOperation =
          this.guard(cloudFunctionServiceOperation) &&
          (await this.createCloudFunction(projectId));
        this.saveSession(
          OperationType.CreatingCloudFunction,
          cloudFunctionOperation
        );
      }
    } else {
      console.warn("Google Access Token is not set", this.accessToken.google);
    }

    return Promise.resolve(true);
  }

  shouldSkip(operation: OperationType) {
    const operationSteps = this.getSavedSession();
    if (operationSteps[operation]) {
      console.groupCollapsed("[RESTORING]", OperationType[operation]);
      console.log(operationSteps[operation]);
      console.groupEnd();
    }

    return this.operationSteps[operation].isValid;
  }

  /**
   * Request that a new Project be created. The result is an Operation which can be used to track the creation process. 
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
   * Gets the latest state of a long-running operation. 
   * Check if the created project is available. 
   * Starts polling (1 second) and exits when the project is ready.
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
            `https://cloudresourcemanager.googleapis.com/v1/operations/${createdPorject.name}`
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
    this.notify(OperationType.CheckingCloudFunctionPermissions, true, false);

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
        OperationType.CheckingCloudFunctionPermissions,
        false,
        true,
        null,
        `Permissions set for "${projectId}".`
      );
    } else {
      // error

      this.notify(
        OperationType.CheckingCloudFunctionPermissions,
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
    this.notify(OperationType.CheckingCloudFunctionPermissions, true, false);

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
              null
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
   * Create a new Cloud Function for the given project ID.
   * 
   * @param projectId The project ID to link with the new Cloud Function.
   */
  async createCloudFunction(projectId) {
    return new Promise(async (resolve, reject) => {
      this.notify(OperationType.CreatingCloudFunction, true, false);

      const locationId = `projects/${projectId}/locations/us-central1`;
      const entryPoint = CLOUD_FUNCTION_ENTRYPOINT;

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
      `https://sourcerepo.googleapis.com/v1/projects/${projectId}/repos`,
      {
        method: "POST",
        body: {
          name: `projects/${projectId}/repos/default`
          // @todo mirrorConfig seems to be read only!!!
          // mirrorConfig: {
          //   url: 'https://github.com/actions-on-google-builder/actions-on-google-project-template.git'
          // }
        } as Repo
      }
    );
    console.log(repoInfo);

    if (repoInfo.error) {
      this.notify(
        OperationType.CreatingCloudRepository,
        false,
        false,
        repoInfo.error
      );
    } else {
      // success
      this.notify(
        OperationType.CreatingCloudRepository,
        false,
        true,
        null,
        `Created Cloud Repository for "${projectId}".`
      );
    }

    return repoInfo;
  }

  async createCloudBucket(projectId: string) {
    this.notify(OperationType.CreatingCloudBucket, true, false);
    const bucketInfo: BucketResource = await this.fetch(
      `https://www.googleapis.com/storage/v1/b?project=${projectId}`,
      {
        method: "POST",
        body: {
          name: `${projectId}-${BUCKET_NAME}`,
          location: "us-central1"
        } as BucketResource
      }
    );

    if (bucketInfo.error) {
      this.notify(
        OperationType.CreatingCloudBucket,
        false,
        false,
        bucketInfo.error
      );
    } else {
      this.notify(
        OperationType.CreatingCloudBucket,
        false,
        true,
        null,
        `Created Cloud Bucket "${bucketInfo.name}".`
      );
    }

    console.log(bucketInfo);
    return bucketInfo;
  }

  async enablePermissionsForDataSink(projectId: string) {
    this.notify(OperationType.EnablePermissionsForGCPDataSink, true, false);

    const googleServiceAccounts: GoogleServiceAccount = await this.fetch(
      `https://storagetransfer.googleapis.com/v1/googleServiceAccounts/${projectId}`
    );

    if (googleServiceAccounts.error) {
      this.notify(OperationType.EnablePermissionsForGCPDataSink, false, false, googleServiceAccounts.error);
      return null;
    }

    const iam: IamPolicy = await this.fetch(
      `https://www.googleapis.com/storage/v1/b/${projectId}-${BUCKET_NAME}/iam`,
      {
        method: "PUT",
        body: {
          kind: "storage#policy",
          resourceId: `projects/_/buckets/${projectId}-${BUCKET_NAME}`,
          bindings: [
            {
              role: "roles/storage.admin",
              members: [
                `serviceAccount:${googleServiceAccounts.accountEmail}`,
                `projectOwner:${projectId}`
              ]
            }
          ]
        }
      }
    );

    if (iam.error) {
      this.notify(OperationType.EnablePermissionsForGCPDataSink, false, false, iam.error);
    }
    else {
      this.notify(OperationType.EnablePermissionsForGCPDataSink, false, true, null, `Granted write permissions for "${projectId}".`);
    }
    return iam;
  }

  //@wip
  async createTransferJob(projectId: string) {
    this.notify(OperationType.UploadingProjectTemplate, true, false);

    return new Promise(async (resolve, reject) => {
      const scheduleDay = {
        day: 6,
        month: 8,
        year: 2017
      };

      const transferJob: TransferJob = await this.fetch(
        `https://storagetransfer.googleapis.com/v1/transferJobs`,
        {
          method: "POST",
          body: {
            description: 'Transfer Actions on Google project template from Github',
            status: TransferJobStatus[TransferJobStatus.ENABLED],
            projectId,
            schedule: {
              scheduleStartDate: scheduleDay,
              scheduleEndDate: scheduleDay
            },
            transferSpec: {
              httpDataSource: {
                listUrl:
                  "https://raw.githubusercontent.com/actions-on-google-builder/app-builder/master/gcp-storage-transfer/actions-on-google-project-template.tsv"
              },
              gcsDataSink: {
                bucketName: `${projectId}-${BUCKET_NAME}`
              },
              transferOptions: {
                deleteObjectsFromSourceAfterTransfer: false,
                overwriteObjectsAlreadyExistingInSink: false
              }
            }
          } as TransferJob
        }
      );

      console.log(transferJob);

      const args = encodeURIComponent(`{"projectId":"${projectId}"}`);
      const transferJobStatus = await this.fetch(`https://storagetransfer.googleapis.com/v1/tranferOperations?filter=%7B"project_id":"aaaaaazzzzzzzzzzzzeeeeeeeee","job_id":%5B"transferJobs/00000000000000000000"%5D%7D`);

      console.log(transferJob);

      if (transferJob.error) {
        this.notify(
          OperationType.UploadingProjectTemplate,
          false,
          false,
          transferJob.error
        );
      } else {
        this.notify(OperationType.UploadingProjectTemplate, false, true, null, `Uploaded Project template to bucket "${projectId}-${BUCKET_NAME}".`);
      }

      // let response;
      // this.poll( async(timer) => {

      //   // https://storagetransfer.googleapis.com/v1/tranferOperations?filter=%7B"project_id":"PROJECT_ID","job_id":%5B"transferJobs/00000000000000000000"%5D%7D

      // });

      return transferJob;
    });
  }

  /**
   * Run a block of code every 1 second.
   * 
   * @param callback The code to be executed every 1 second
   */
  poll(callback: Function, max = 3) {
    let timer = null;
    let count = 0;
    timer = setInterval(arg => {
      try {
        callback(timer);
      } catch (e) {
        clearInterval(timer);
      }

      if (count++ >= max) {
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

    if (isValid) {
      this.operationSteps[id].description = this.operationSteps[id].description_2
    }

    if (error) {
      const errorMsg = `[${error.status}] ${error.message}`;
      this.operationSteps[id].error = error.status || "ERROR";

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

  saveSession(operation: OperationType, entity: any) {
    const ope = this.getSavedSession();
    ope[operation] = entity;
    localStorage.setItem("operationSteps", JSON.stringify(ope));
  }

  getSavedSession(): { [key: string]: string } {
    return JSON.parse(localStorage.getItem("operationSteps") || "{}");
  }

  isAllOperationsOK() {
    return this.operationSteps.every(s => s.isValid === true);
  }

  async fetch(url, opts = {} as any): Promise<{ [key: string]: string }> {
    console.info("[REQUESTING]", url);
    console.info(opts);

    if (opts.body) {
      opts.body = JSON.stringify(opts.body);
    }

    opts.headers = {
      Authorization: `Bearer ${this.accessToken.google}`,
      "Content-Type": "application/json"
    };

    const f = await fetch(url, opts);
    const json = await f.json();
    console.info(json);

    return json;
  }
}
