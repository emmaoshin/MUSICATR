export interface FileInfo {
  path: string;
  name: string;
  ext: string;
  size: number;
  modTime: string;
}

export interface LastImageState {
  path: string | null;
  timestamp: number;
} 