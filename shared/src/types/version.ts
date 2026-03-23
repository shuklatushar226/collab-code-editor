export interface Version {
  id: string;
  roomId: string;
  fileId: string;
  content: string;
  createdBy: string;
  createdAt: number;
  label?: string;
  description?: string;
}

export interface VersionDiff {
  fromVersion: string;
  toVersion: string;
  additions: number;
  deletions: number;
  patches: DiffPatch[];
}

export interface DiffPatch {
  type: 'add' | 'remove' | 'equal';
  line: number;
  content: string;
}
