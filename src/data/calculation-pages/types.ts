export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface NearbyLink {
  slug: string;
  label: string;
  href: string;
  description: string;
}

// Download Cluster Types
export interface DownloadTimeRow {
  speedLabel: string;
  speedMbps: number;
  theoreticalDuration: string;
  planningDuration: string;
  effectiveMBs: string;
}

export interface RequiredDownloadSpeedRow {
  deadlineLabel: string;
  targetSeconds: number;
  requiredEffectiveMBs: string;
  requiredInternetPlanMbps: string;
  isFeasible: boolean;
}

export interface DownloadPageData {
  slug: string;
  sizeGb: number;
  sizeFormatted: string;
  title: string;
  metaDescription: string;
  h1: string;
  directAnswerSummary: string;
  defaultSpeedLabel: string;
  defaultPlanningDuration: string;
  defaultTheoreticalDuration: string;
  defaultEffectiveSpeed: string;
  contextNotes: string[];
  comparisonRows: DownloadTimeRow[];
  requiredSpeedRows: RequiredDownloadSpeedRow[];
  calculatorQuery: string;
  nearbyPages: NearbyLink[];
}

// Upload Cluster Types
export interface UploadTimeRow {
  speedLabel: string;
  speedMbps: number;
  purePayloadDuration: string;
  plannedDurationWithReserve: string;
  effectiveThroughput: string;
}

export interface RequiredUploadSpeedRow {
  deadlineLabel: string;
  targetSeconds: number;
  requiredEffectiveSpeed: string;
  requiredNominalSpeed: string;
  isFeasible: boolean;
}

export interface UploadPageData {
  slug: string;
  sizeGb: number;
  sizeFormatted: string;
  title: string;
  metaDescription: string;
  h1: string;
  directAnswerSummary: string;
  defaultSpeedLabel: string;
  defaultPlannedDuration: string;
  defaultPayloadDuration: string;
  defaultEffectiveSpeed: string;
  contextNotes: string[];
  comparisonRows: UploadTimeRow[];
  requiredSpeedRows: RequiredUploadSpeedRow[];
  calculatorQuery: string;
  nearbyPages: NearbyLink[];
}

// File Transfer Cluster Types
export interface FileTransferScenarioRow {
  scenarioName: string;
  sourceDrive: string;
  interfaceBus: string;
  destinationDrive: string;
  bottleneckStage: string;
  sustainedThroughput: string;
  transferDuration: string;
}

export interface RequiredInterfaceRow {
  deadlineLabel: string;
  targetSeconds: number;
  requiredInterfaceSpeed: string;
  isFeasible: boolean;
  notes: string;
}

export interface FileTransferPageData {
  slug: string;
  sizeGb: number;
  sizeFormatted: string;
  title: string;
  metaDescription: string;
  h1: string;
  directAnswerSummary: string;
  baselineScenarioName: string;
  baselineDuration: string;
  baselineThroughput: string;
  baselineBottleneck: string;
  contextNotes: string[];
  scenarios: FileTransferScenarioRow[];
  requiredInterfaceRows: RequiredInterfaceRow[];
  calculatorQuery: string;
  nearbyPages: NearbyLink[];
}

// Video Cluster Types
export interface VideoBitrateRow {
  useCaseLabel: string;
  videoBitrateMbps: number;
  audioBitrateKbps: number;
  totalBitrateMbps: string;
  calculatedFileSize: string;
  storagePerMinute: string;
}

export interface TargetStorageRow {
  storageLimitLabel: string;
  maxAllowableVideoBitrate: string;
  isFeasible: boolean;
  recommendation: string;
}

export interface VideoPageData {
  slug: string;
  durationLabel: string;
  durationSeconds: number;
  audioBitrateKbps: number;
  title: string;
  metaDescription: string;
  h1: string;
  directAnswerSummary: string;
  baselineUseCase: string;
  baselineFileSize: string;
  baselineTotalBitrate: string;
  contextNotes: string[];
  bitrateRows: VideoBitrateRow[];
  storageBudgetRows: TargetStorageRow[];
  calculatorQuery: string;
  nearbyPages: NearbyLink[];
}
