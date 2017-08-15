import { Subject } from "rxjs/Subject";
// NOTE: order is important!
export enum OperationType {
  CreatingProject,
  CheckingProjectAvailability,
  CheckingBilling,
  EnablingBilling,
  CreatingCloudBucket,
  EnablePermissionsForGCPDataSink,
  UploadingProjectTemplate,
  CreatingCloudRepository,
  CheckingCloudFunctionPermissions,
  EnablingCloudFunctionService,
  CreatingCloudFunction
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

export enum TransferJobStatus {
  STATUS_UNSPECIFIED,
  ENABLED,
  DISABLED,
  DELETED,
  IN_PROGRESS
}

export interface OnSessionExpired {
  onSessionExpired: Subject<boolean>;
}
export interface Runnable {
  run(projectId?: string): Promise<void>;
  fetch(url, opts?: any): Promise<{ [key: string]: string }>;
}

export interface ErrorStatus {
  error?: Status;
}

export interface ProjectBillingInfo extends ErrorStatus {
  name?: string;
  projectId?: string;
  billingAccountName?: string;
  billingEnabled?: boolean;
}

export interface BillingAccount {
  name?: string;
  open?: boolean;
  displayName?: string;
}

export interface BillingAccounts extends ErrorStatus {
  billingAccounts?: Array<BillingAccount>;
}

export interface Repo extends ErrorStatus {
  name?: string;
  size?: string;
  url?: string;
  mirrorConfig?: MirrorConfig;
}

export interface BucketResource extends ErrorStatus {
  kind?: string; // "storage#bucket";
  id?: string;
  selfLink?: string;
  projectNumber?: number;
  name?: string;
  timeCreated?: Date;
  updated?: Date;
  metageneration?: number;
  acl?: any[];
  location?: string;
  labels?: {
    [key: string]: string;
  };
  storageClass?: string;
  etag?: string;
}

export interface MirrorConfig {
  url?: string;
  webhookId?: string;
  deployKeyId?: string;
}

export interface Operation extends ErrorStatus {
  name?: string;
  message?: string;
  metadata?: {
    "@type"?: string;
  };
  done?: boolean;
  response?: {
    "@type"?: string;
  };
}

export interface TransferJob extends ErrorStatus {
  name?: string;
  description?: string;
  projectId?: string;
  transferSpec?: TransferSpec;
  schedule?: any;
  status?: Status;
  creationTime?: string;
  lastModificationTime?: string;
  deletionTime?: string;
}

export interface TransferSpec {
  objectConditions?: {
    minTimeElapsedSinceLastModification?: string;
    maxTimeElapsedSinceLastModification?: string;
    includePrefixes?: string[];
    excludePrefixes?: string[];
  };
  transferOptions?: {
    overwriteObjectsAlreadyExistingInSink?: boolean;
    deleteObjectsUniqueInSink?: boolean;
    deleteObjectsFromSourceAfterTransfer?: boolean;
  };
  gcsDataSource?: {
    bucketName?: string;
  };
  httpDataSource?: {
    listUrl?: string;
  };
  gcsDataSink?: {
    bucketName?: string;
  };
  counters?: TransferJobCounters;
  status?: string;
}

export interface TransferJobCounters {
  bytesFoundFromSource?: number;
  objectsFoundFromSource?: number;
}

export interface Status {
  code?: number;
  status?: string;
  message?: string;
  details?: Array<{
    "@type": string;
    [key: string]: string;
  }>;
}

export interface Project {
  projectNumber?: string;
  projectId?: string;
  lifecycleState?: LifecycleState;
  name?: string;
  createTime?: string;
  labels?: {
    [key: string]: string;
  };
  parent?: ResourceId;
}

export interface ResourceId {
  type?: string;
  id?: string;
}

export interface Step {
  enabled?: boolean;
  isValid?: boolean;
  isDirty?: boolean;
  isWorking?: boolean;
  isSkipped?: boolean;
  description?: string;
  description_2?: string;
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

export interface Role extends ErrorStatus {
  name?: string;
  title?: string;
  description?: string;
  includedPermissions?: string[];
  stage?: RoleLaunchStage;
  etag?: string;
  deleted?: boolean;
}

export interface RoleRequest {
  roleId?: string;
  role?: Role;
}

export interface GoogleServiceAccount extends ErrorStatus {
  accountEmail?: string;
}

export interface IamPolicy extends ErrorStatus {
  kind?: string; // storage#policy,
  resourceId?: string;
  bindings?: {
    role?: string;
    members?: string[];
  }[];
  etag?: string;
}

export interface TransferJobOperations extends ErrorStatus {
  operations?: TransferJobOperation[];
}
export interface TransferJobOperation extends Operation {
  name?: string;
  metadata?: {
    "@type"?: string; // type.googleapis.com/google.storagetransfer.v1.TransferOperation
    name?: string;
    projectId: string;
    transferSpec?: TransferSpec;
    response?: {
      "@type"?: string; // type.googleapis.com/google.protobuf.Empty
    };
  };
}
