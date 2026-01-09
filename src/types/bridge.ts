/**
 * Forge Bridge Types
 */

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  modifiedAt: Date;
  createdAt?: Date;
  permissions: string;
}

export interface DirectoryListing {
  path: string;
  files: FileInfo[];
  totalCount: number;
}

export interface SyncStatus {
  path: string;
  synced: boolean;
  lastSyncAt?: Date;
  pendingChanges: number;
}



