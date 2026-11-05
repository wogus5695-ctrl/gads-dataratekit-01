export * from './types';
export * from './download-pages';
export * from './download-speed-pages';
export * from './upload-pages';
export * from './nas-pages';
export * from './file-transfer-pages';
export * from './file-transfer-scenario-pages';
export * from './video-pages';
export * from './video-profile-pages';

import { DOWNLOAD_PAGES } from './download-pages';
import { DOWNLOAD_SPEED_PAGES } from './download-speed-pages';
import { UPLOAD_PAGES } from './upload-pages';
import { NAS_PAGES } from './nas-pages';
import { FILE_TRANSFER_PAGES } from './file-transfer-pages';
import { FILE_TRANSFER_SCENARIOS } from './file-transfer-scenario-pages';
import { VIDEO_PAGES } from './video-pages';
import { VIDEO_PROFILE_PAGES } from './video-profile-pages';

export const PSEO_CANONICAL_ROUTES = [
  // Download Size Pages (7 total: 4 from batch 1, 3 new in batch 2)
  ...DOWNLOAD_PAGES.map((p) => `/download-time/${p.slug}` as const),

  // Download Speed Pages (5 new in batch 2)
  ...DOWNLOAD_SPEED_PAGES.map((p) => `/download-speed/${p.slug}` as const),

  // Upload Size Pages (7 total: 4 from batch 1, 3 new in batch 2)
  ...UPLOAD_PAGES.map((p) => `/upload-time/${p.slug}` as const),

  // NAS Transfer Pages (3 new in batch 2)
  ...NAS_PAGES.map((p) => `/nas-transfer-time/${p.slug}` as const),

  // File Transfer Size Pages (2 from batch 1)
  ...FILE_TRANSFER_PAGES.map((p) => `/file-transfer-time/${p.slug}` as const),

  // File Transfer Hardware Scenarios (2 new in batch 2)
  ...FILE_TRANSFER_SCENARIOS.map((s) => `/file-transfer-time/${s}` as const),

  // Video Duration Pages (2 from batch 1)
  ...VIDEO_PAGES.map((p) => `/video-file-size/${p.slug}` as const),

  // Video Profile Pages (6 new in batch 2)
  ...VIDEO_PROFILE_PAGES.map((p) => `/video-file-size/${p.slug}` as const),
] as const;

export type PseoRoute = typeof PSEO_CANONICAL_ROUTES[number];
