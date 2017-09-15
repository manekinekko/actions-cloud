import { SessionService } from "./session.service";
import { NotifierService } from "./notifier.service";
import {
  Operation,
  ProjectBillingInfo,
  Repo,
  Step,
  OperationType,
  Project,
  BillingAccounts,
  BillingAccount,
  RoleRequest,
  SourceRepository,
  CloudFunction,
  BucketResource,
  Status,
  Role,
  GoogleServiceAccount,
  IamPolicy,
  TransferJob,
  TransferJobStatus,
  TransferJobOperations,
  TransferJobOperation,
  Runnable,
  OnSessionExpired
} from "./gcp.types";
import { Injectable } from "@angular/core";
import { MdSnackBar } from "@angular/material";
import { Subject } from "rxjs/Subject";

const BUCKET_NAME = "bucket";
const CLOUD_FUNCTION_ENTRYPOINT = "agent";
const TSV_FILE =
  "https://raw.githubusercontent.com/manekinekko/actions-on-google-wizard/master/gcp-storage-transfer/actions-on-google-project-template.tsv?token=ABnuHYjwLm45TQAPh7-qxAIZwhbRyNSWks5Zng90wA%3D%3D";

@Injectable()
export class GcpService implements Runnable, OnSessionExpired {
  onSessionExpired: Subject<boolean>;
  operationSteps: Step[];
  notifier: NotifierService;
  accessToken: string;

  constructor(
    public snackBar: MdSnackBar, 
    public session: SessionService) {
    this.notifier = new NotifierService(snackBar).registerService(this);
    this.accessToken = null;
    this.onSessionExpired = new Subject();
    this.resetOperations();

    // setTimeout(_ => {
    //   this.mirrorGithubRepoToCloudRepo("aaaaaazzzzzzzzzzzzeeeeeeeee");
    // }, 2000);
  }

  resetOperations() {
    this.operationSteps = [
      // CreatingProject
      {
        enabled: true,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating project...`,
        description_2: `Project created.`
      },
      // CheckingProjectAvailability
      {
        enabled: true,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking project availability...`,
        description_2: `Project is ready.`
      },
      // CheckingBilling
      {
        enabled: true,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Checking billing...`,
        description_2: `Found Billing account.`
      },
      // EnablingBilling
      {
        enabled: true,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Enabling billing...`,
        description_2: `Enabled Billing for project.`
      },
      // CreatingCloudBucket
      {
        enabled: false,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating Cloud Bucket...`,
        description_2: `Created Cloud Bucket.`
      },
      // EnablePermissionsForGCPDataSink
      {
        enabled: false,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Granting write permissions for bucket...`,
        description_2: `Granted write permissions for bucket.`
      },
      // UploadingProjectTemplate
      {
        enabled: false,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Copying project template (may take up to 5min)...`,
        description_2: `Copied Project template to bucket.`
      },
      // CreatingCloudRepository
      {
        enabled: true,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating Cloud Repository...`,
        description_2: `Created Cloud Repository.`
      },
      // CheckingCloudFunctionPermissions
      {
        enabled: false, 
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Granting permissions to use Cloud Functions...`,
        description_2: `Granted permissions fro Cloud Functions.`
      },
      // EnablingCloudFunctionService
      {
        enabled: true,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Enabling Cloud Function service...`,
        description_2: `Enabled Cloud Function service.`
      },
      // CreatingCloudFunction
      {
        enabled: false,
        isValid: false,
        isDirty: false,
        isWorking: false,
        error: "",
        description: `Creating Cloud Function "agent"...`,
        description_2: `Created Cloud Function.`
      }
    ];

    // @todo remove this
    // this.__skipSteps(
    //   OperationType.CreatingProject,
    //   OperationType.CheckingProjectAvailability
    // );
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

  restoreOperations() {
    let restoredOperations = this.session.restoreOperation('google');

    if (restoredOperations) {
      Object.keys(OperationType).forEach( key => {
        if (restoredOperations[OperationType[key]]) {
          this.notifier.notify(OperationType[key], false, true);
        }
      });
    }
  }

  restoreToken() {
    this.accessToken = this.session.getAccessToken("google");
  }

  resetToken() {
    this.setToken(null);
  }

  setToken(accessToken) {
    if (accessToken) {
      this.accessToken = accessToken;
    }
    this.session.setAccessToken("google", accessToken);
  }

  guard(operation: Operation): boolean {
    const predicate = operation && !operation.error;

    console.groupCollapsed("[GUARD]");
    console.log(operation);
    console.groupEnd();

    return predicate;
  }

  /**
   * Just a macro that runs the same logic but with different methods from this class
   * 
   * @param operationName The function name to invoke on this class
   * @param lastOperation last operation if any, null otherwise
   * @param operationType An operation type
   */
  async runMacro(logic: Function, lastOperation: {}, operationType: OperationType) {
    let operation = null;
    if (this.isOperationEnabled(operationType)) {
      if (this.shouldSkip(operationType)) {
        this.notifier.notify(operationType, false, true);
      } else {

        if (lastOperation) {
          operation = this.guard(lastOperation) && (await logic());
        }
        else {
          operation = await logic();
        }

        if (operation.error && operation.error.status === "ALREADY_EXISTS") {
          return {
            "PREVIOUS_ENTITY_ALREADY_EXISTS": true
          } as Operation;
        }
        else if (operation.error) {
          return Promise.reject(operation.error);
        }
        else {
          this.session.saveOperation("google", operationType, operation);
        }
      }
    }
    return operation;
  }

  /**
   * Start the creating process of the new project
   * 
   * @param projectId the project ID to create on the GCP
   */
  async run(projectId: string) {
    if (this.accessToken) {
      let lastOperation = null;  
      lastOperation = await this.runMacro( async () => await this.createCloudProject(projectId),                  lastOperation,  OperationType.CreatingProject);
      
      lastOperation = await this.runMacro( async () => {
        
        let op;
        if (lastOperation["PREVIOUS_ENTITY_ALREADY_EXISTS"]) {
          op = await this.getCloudProjectIfAlreadyExists(projectId);
        }
        else {
          op = await this.checkProjectAvailability(lastOperation);
        }
        return op;

      }, lastOperation,  OperationType.CheckingProjectAvailability);
      
      lastOperation = await this.runMacro( async () => await this.checkBilling(),                                 lastOperation,  OperationType.CheckingBilling);
      lastOperation = await this.runMacro( async () => await this.enablingBillingInfo(projectId, lastOperation),  lastOperation,  OperationType.EnablingBilling);
      lastOperation = await this.runMacro( async () => await this.createCloudBucket(projectId),                   lastOperation,  OperationType.CreatingCloudBucket);
      lastOperation = await this.runMacro( async () => await this.enablePermissionsForDataSink(projectId),        lastOperation,  OperationType.EnablePermissionsForGCPDataSink);
      lastOperation = await this.runMacro( async () => await this.createTransferJob(projectId),                   lastOperation,  OperationType.UploadingProjectTemplate);
      lastOperation = await this.runMacro( async () => await this.createCloudRepository(projectId),               lastOperation,  OperationType.CreatingCloudRepository);
      
      // @todo doesn't seem to be needed anymore!!??
      // lastOperation = await this.runMacro( async () => await this.checkCloudFunctionPermissions(projectId),       lastOperation,  OperationType.CheckingCloudFunctionPermissions);

      lastOperation = await this.runMacro( async () => await this.enableCloudFunctionService(projectId),          lastOperation,  OperationType.EnablingCloudFunctionService);
      
      // @todo this step will be done by the user!!
      // lastOperation = await this.runMacro( async () => await this.createCloudFunction(projectId),                 lastOperation,  OperationType.CreatingCloudFunction);
      
      if (this.isAllOperationsOK()) {
        return Promise.resolve(lastOperation);
      } else {
        return Promise.reject(lastOperation);
      }
    } else {

      console.warn("Google Access Token is not set", this.accessToken);
      this.notifier.notify(null, false, false, {
        message: "Your Google Cloud Platform account could not be linked."
      });

      return Promise.reject({status: "NO_ACCESS_TOKEN"});
    }
  }

  shouldSkip(operation: OperationType) {
    const operationSteps = this.session.restoreOperation("google");
    if (operationSteps[operation]) {
      console.log(
        "[RESTORING]",
        OperationType[operation],
        operationSteps[operation]
      );
    }

    return this.operationSteps[operation].isValid;
  }

  isOperationEnabled(operation: OperationType) {
    return this.operationSteps[operation].enabled;
  }

  /**
   * Request that a new Project be created. The result is an Operation which can be used to track the creation process. 
   * 
   * @param projectId the project ID to create on the GCP
   */
  async createCloudProject(projectId: string) {
    this.notifier.notify(OperationType.CreatingProject, true, false);

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
      if (createdPorject.error.status === "ALREADY_EXISTS") {
        this.notifier.notify(
            OperationType.CreatingProject,
            false,
            true
          );
      }
      else {
        this.notifier.notify(
            OperationType.CreatingProject,
            false,
            false,
            createdPorject.error
          );
      }

    } else if (createdPorject.name) {
      // success

      this.notifier.notify(
        OperationType.CreatingProject,
        false,
        true,
        null,
        `Project "${projectId}" created.`
      );
    }

    return createdPorject;
  }

  async getCloudProjectIfAlreadyExists(projectId: string) {

    this.notifier.notify(
      OperationType.CheckingProjectAvailability,
      true,
      false
    );
    
    const createdPorject: Operation = await this.fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`);

    if (createdPorject.error) {

      this.notifier.notify(
        OperationType.CheckingProjectAvailability,
        false,
        false,
        createdPorject.error
      );

    }
    else {

      this.notifier.notify(
        OperationType.CheckingProjectAvailability,
        false,
        true,
        null,
        `Project "${createdPorject.name}" is ready.`
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
  async checkProjectAvailability(createdPorject: Operation): Promise<Operation> {
    return new Promise((resolve, reject) => {

      this.notifier.notify(
        OperationType.CheckingProjectAvailability,
        true,
        false
      );

      let projectAvailability = null;
      const stop = this.poll(async timer => {
        try {
          projectAvailability = await this.fetch(
            `https://cloudresourcemanager.googleapis.com/v1/operations/${createdPorject.name}`
          );
          console.log(projectAvailability);

          if (projectAvailability.error) {
            this.notifier.notify(
              OperationType.CheckingProjectAvailability,
              false,
              false,
              projectAvailability.error
            );
            stop();
            resolve(projectAvailability);
          } else if (projectAvailability.response) {
            this.notifier.notify(
              OperationType.CheckingProjectAvailability,
              false,
              true,
              null,
              `Project "${createdPorject.name}" is ready.`
            );
            stop();
            resolve(projectAvailability);
          }
        } catch (e) {
          stop();
          reject(e);
        }
      });
    });
  }

  /**
   * Retrieve the user's billing account information.
   */
  async checkBilling(): Promise<ProjectBillingInfo> {
    this.notifier.notify(OperationType.CheckingBilling, true, false);

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
          this.notifier.notify(
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

      this.notifier.notify(
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
    this.notifier.notify(OperationType.EnablingBilling, true, false);

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
      this.notifier.notify(
        OperationType.EnablingBilling,
        false,
        true,
        null,
        `Enabled Billing for "${projectId}".`
      );
      return projectBillingInfo;
    } else {
      this.notifier.notify(OperationType.EnablingBilling, false, false, {
        message: `Could not enable billing for "${projectId}".`
      });
      return null;
    }
  }

  async checkCloudFunctionPermissions(projectId: string): Promise<Role> {
    this.notifier.notify(
      OperationType.CheckingCloudFunctionPermissions,
      true,
      false
    );

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
      this.notifier.notify(
        OperationType.CheckingCloudFunctionPermissions,
        false,
        true,
        null,
        `Permissions set for "${projectId}".`
      );
    } else {
      // error

      this.notifier.notify(
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
    this.notifier.notify(
      OperationType.CheckingCloudFunctionPermissions,
      true,
      false
    );

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
      this.notifier.notify(
        OperationType.EnablingCloudFunctionService,
        true,
        false
      );

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
            stop();
            this.notifier.notify(
              OperationType.EnablingCloudFunctionService,
              false,
              true,
              null
            );
            resolve(response);
          } else if (response.error) {
            stop();
            this.notifier.notify(
              OperationType.EnablingCloudFunctionService,
              false,
              false,
              response.error
            );
            resolve(response);
          }
        } catch (e) {
          reject(e);
          stop();
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
      this.notifier.notify(OperationType.CreatingCloudFunction, true, false);

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
              // repositoryUrl: `https://github.com/manekinekko/actions-on-google-project-template/`,
              sourcePath: "/",
              branch: "master"
            } as SourceRepository,
            httpsTrigger: {}
          } as CloudFunction
        }
      );

      if (operation.error) {
        this.notifier.notify(
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

              stop();
              resolve(response);
              this.notifier.notify(
                OperationType.CreatingCloudFunction,
                false,
                false,
                response.error
              );
            } else if (response.done) {
              // success

              stop();
              resolve(response);
              this.notifier.notify(
                OperationType.CreatingCloudFunction,
                false,
                false,
                null,
                `Creating Cloud Function "${entryPoint}"...`
              );
            }
          } catch (e) {
            reject(e);
            stop();
          }
        });
      }
    });
  }

  async createCloudRepository(projectId: string) {
    this.notifier.notify(OperationType.CreatingCloudRepository, true, false);

    const repoInfo: Repo = await this.fetch(
      `https://sourcerepo.googleapis.com/v1/projects/${projectId}/repos`,
      {
        method: "POST",
        body: {
          name: `projects/${projectId}/repos/default`,
          // @todo mirrorConfig seems to be read only!!!
          // mirrorConfig: {
          //   url: 'git@github.com:actions-on-google-wizard/actions-on-google-project-template-gcp.git',
          //   webhookId: 'git@github.com:actions-on-google-wizard/actions-on-google-project-template-gcp.git',
          //   deployKeyId: 'git@github.com:actions-on-google-wizard/actions-on-google-project-template-gcp.git',
          // }
        } as Repo
      }
    );
    console.log(repoInfo);

    if (repoInfo.error) {
      this.notifier.notify(
        OperationType.CreatingCloudRepository,
        false,
        false,
        repoInfo.error
      );
    } else {
      // success
      this.notifier.notify(
        OperationType.CreatingCloudRepository,
        false,
        true,
        null,
        `Created Cloud Repository for "${projectId}".`
      );
    }

    return repoInfo;
  }

  async mirrorGithubRepoToCloudRepo(projectId) {

    const githubUrl = encodeURI("git@github.com:actions-on-google-wizard/actions-on-google-project-template-gcp.git");
    const cloudRepoName = "default";
    
    // document.cookie = "CONSENT=YES+FR.en+20160410-02-0; expires=Thu, 01 Jan 2222 00:00:00 GMT";

    const syncInfo = await this.fetch(`https://console.cloud.google.com/m/clouddev/reposync/github/connect?pid=${projectId}&repoName=${cloudRepoName}&url=${ githubUrl }`, {
      method: "POST",
      // headers: {
      //   "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      // },
      // credentials: "include", // send cookie
      // body: {}
      mode: "no-cors"
    });
    console.log(syncInfo);
    
  }

  async createCloudBucket(projectId: string) {
    this.notifier.notify(OperationType.CreatingCloudBucket, true, false);
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
      this.notifier.notify(
        OperationType.CreatingCloudBucket,
        false,
        false,
        bucketInfo.error
      );
    } else {
      this.notifier.notify(
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
    this.notifier.notify(
      OperationType.EnablePermissionsForGCPDataSink,
      true,
      false
    );

    const googleServiceAccounts: GoogleServiceAccount = await this.fetch(
      `https://storagetransfer.googleapis.com/v1/googleServiceAccounts/${projectId}`
    );

    if (googleServiceAccounts.error) {
      this.notifier.notify(
        OperationType.EnablePermissionsForGCPDataSink,
        false,
        false,
        googleServiceAccounts.error
      );
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
      this.notifier.notify(
        OperationType.EnablePermissionsForGCPDataSink,
        false,
        false,
        iam.error
      );
    } else {
      this.notifier.notify(
        OperationType.EnablePermissionsForGCPDataSink,
        false,
        true,
        null,
        `Granted write permissions for "${projectId}".`
      );
    }
    return iam;
  }

  // @wip
  async createTransferJob(projectId: string) {
    this.notifier.notify(OperationType.UploadingProjectTemplate, true, false);

    return new Promise(async (resolve, reject) => {
      const date = new Date();
      const scheduleDay = {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
      };

      const transferJob: TransferJob = await this.fetch(
        `https://storagetransfer.googleapis.com/v1/transferJobs`,
        {
          method: "POST",
          body: {
            description:
              "Transfer Actions on Google project template from Github",
            status: TransferJobStatus[TransferJobStatus.ENABLED],
            projectId,
            schedule: {
              scheduleStartDate: scheduleDay,
              scheduleEndDate: scheduleDay
            },
            transferSpec: {
              httpDataSource: {
                listUrl: TSV_FILE
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

      if (transferJob.error) {
        this.notifier.notify(
          OperationType.UploadingProjectTemplate,
          false,
          false,
          transferJob.error
        );
      }

      let transferJobStatus: TransferJobOperations;
      const stop = this.poll(
        async timer => {
          transferJobStatus = await this.fetch(
            `https://storagetransfer.googleapis.com/v1/transferOperations?filter=%7B%22project_id%22%3A%22${projectId}%22%2C%22job_names%22%3A%5B%22${encodeURIComponent(
              transferJob.name
            )}%22%5D%7D`
          );
          console.log("transferJobStatus", transferJobStatus);

          if (
            transferJobStatus.operations &&
            transferJobStatus.operations.length > 0
          ) {
            const transferOp: TransferJobOperation =
              transferJobStatus.operations[0];
            if (transferOp.done === true) {
              this.notifier.notify(
                OperationType.UploadingProjectTemplate,
                false,
                true
              );
              stop();
            } else if (transferOp.done === false) {
              this.notifier.notify(
                OperationType.UploadingProjectTemplate,
                false,
                false,
                transferOp.error
              );
              stop();
            }
          }
        },
        300 /* 5min */,
        () => {
          // on timeout
          this.notifier.notify(
            OperationType.UploadingProjectTemplate,
            false,
            false,
            {
              status: "[TIMEOUT]"
            }
          );
        }
      );

      return transferJobStatus;
    });
  }

  /**
   * Run a block of code every 1 second.
   * 
   * @param callback The code to be executed every 1 second
   */
  poll(callback: Function, max = 20, timeoutCallback: Function = () => {}) {
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
        timeoutCallback();
      }
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }

  isAllOperationsOK() {
    return this.operationSteps
      .filter(s => s.enabled)  
      .every(s => s.isValid === true);
  }

  async fetch(url, opts = {} as any): Promise<{ [key: string]: string }> {

    if (this.accessToken) {

      console.info("[REQUESTING]", url);
      console.info(opts);

      if (opts.body) {
        opts.body = JSON.stringify(opts.body);
      }

      opts.headers = opts.headers || {};
      opts.headers["Authorization"] = `Bearer ${this.accessToken}`;
      opts.headers["Content-Type"] = opts.headers["Content-Type"] || "application/json";

      // url = `${url}&access_token=${this.accessToken}`;

      const f = await fetch(url, opts);
      const json = await f.json();
      console.info(json);

      return json;

    }
    else {
      this.notifier.notify(null, false, false, {status: "UNAUTHENTICATED"});
      return null;
    }

  }
}
