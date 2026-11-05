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

// Download Speed Cluster Types (New in Step 8-D)
export interface DownloadSpeedFileSizeRow {
  fileSizeLabel: string;
  sizeGb: number;
  theoreticalDuration: string;
  planningDuration: string;
  transferSpeedMBs: string;
}

export interface TimeWindowCapacityRow {
  windowLabel: string;
  windowSeconds: number;
  theoreticalCapacityGb: string;
  planningCapacityGb: string;
}

export interface DownloadSpeedPageData {
  slug: string;
  speedMbps: number;
  speedFormatted: string;
  nominalMBs: string;
  effectivePlanningMBs: string;
  title: string;
  metaDescription: string;
  h1: string;
  directAnswerSummary: string;
  thresholdObservations: string[];
  fileSizeRows: DownloadSpeedFileSizeRow[];
  timeWindowRows: TimeWindowCapacityRow[];
  calculatorQuery: string;
  nearbyPages: NearbyLink[];
}

// NAS Transfer Cluster Types (New in Step 8-D)
export interface NasSizeTransferRow {
  dataSizeLabel: string;
  sizeGb: number;
  interfaceNominalMBs: string;
  planningThroughputMBs: string;
  estimatedDuration: string;
  bottleneckStage: string;
}

export interface NasTransferPageData {
  slug: string;
  displaySpeed: string;
  interfaceLabel: string;
  nominalSpeedGbps: number;
  nominalSpeedMBs: number;
  planningEfficiencyPercent: number;
  planningThroughputMBs: number;
  title: string;
  metaDescription: string;
  h1: string;
  directAnswerSummary: string;
  modelingPrinciples: string[];
  sizeRows: NasSizeTransferRow[];
  storageBottleneckWarnings: string[];
  calculatorQuery: string;
  nearbyPages: NearbyLink[];
}

// File Transfer Scenario Cluster Types (SSD to HDD, SSD to SSD) (New in Step 8-D)
export interface ScenarioHardwareRow {
  scenarioName: string;
  sourceRead: string;
  interfaceBus: string;
  destinationWrite: string;
  limitingBottleneck: string;
  effectiveMBs: string;
  transferDuration100GB: string;
  transferDuration1TB: string;
}

export interface ScenarioSizeComparisonRow {
  sizeLabel: string;
  sizeGb: number;
  standardDuration: string;
  worstCaseDuration: string;
  optimalDuration: string;
}

export interface FileTransferScenarioPageData {
  slug: string;
  scenarioTitle: string;
  scenarioType: 'ssd-to-hdd' | 'ssd-to-ssd';
  title: string;
  metaDescription: string;
  h1: string;
  directAnswerSummary: string;
  baselineExplanation: string[];
  hardwareRows: ScenarioHardwareRow[];
  sizeRows: ScenarioSizeComparisonRow[];
  calculatorQuery: string;
  nearbyPages: NearbyLink[];
}

// Video Profile Cluster Types (720p, 1080p, 1080p60, 1440p, 4K, 4K60) (New in Step 8-D)
export interface VideoProfileDurationRow {
  durationLabel: string;
  durationSeconds: number;
  calculatedFileSize: string;
  upperFileSize?: string; // For 4K bitrate ranges
  storageRateFormatted: string;
}

export interface VideoStorageCardRow {
  cardLabel: string;
  usableCapacityGb: number;
  maxRecordingHours: string;
  notes: string;
}

export interface VideoProfilePageData {
  slug: string;
  profileName: string;
  resolution: string;
  frameRate: string;
  videoBitrateMbps: number;
  upperVideoBitrateMbps?: number; // For ranges
  isRange: boolean;
  audioBitrateKbps: number;
  totalBitrateFormatted: string;
  title: string;
  metaDescription: string;
  h1: string;
  directAnswerSummary: string;
  referenceDisclaimer: string;
  durationRows: VideoProfileDurationRow[];
  storageCapacityRows: VideoStorageCardRow[];
  practicalConsiderations: string[];
  calculatorQuery: string;
  nearbyPages: NearbyLink[];
}
