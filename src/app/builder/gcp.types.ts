export enum OperationType {
  CreatingProject,
  CheckingProjectAvailability,
  CheckingBilling,
  EnablingBilling,
  CreatingCloudBucket,
  UploadingProjectTemplate,
  CreatingCloudRepository,
  CheckingCloudFunctionPermissions,
  EnablingCloudFunctionService,
  CreatingCloudFunction,
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
  DELETED
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

export interface BucketResource {
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

export interface TransferJob {
  name?: string;
  description?: string;
  projectId?: string;
  transferSpec?: TransferSpec;
  schedule?: any;
  status?: Status;
  creationTime?: string;
  lastModificationTime?: string;
  deletionTime?: string;
  error?: Status;
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
