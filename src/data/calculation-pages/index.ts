export * from './types';
export * from './download-pages';
export * from './upload-pages';
export * from './file-transfer-pages';
export * from './video-pages';

import { DOWNLOAD_PAGES } from './download-pages';
import { UPLOAD_PAGES } from './upload-pages';
import { FILE_TRANSFER_PAGES } from './file-transfer-pages';
import { VIDEO_PAGES } from './video-pages';

export const PSEO_CANONICAL_ROUTES = [
  ...DOWNLOAD_PAGES.map((p) => `/download-time/${p.slug}`),
  ...UPLOAD_PAGES.map((p) => `/upload-time/${p.slug}`),
  ...FILE_TRANSFER_PAGES.map((p) => `/file-transfer-time/${p.slug}`),
  ...VIDEO_PAGES.map((p) => `/video-file-size/${p.slug}`),
] as const;

export type PseoRoute = typeof PSEO_CANONICAL_ROUTES[number];
