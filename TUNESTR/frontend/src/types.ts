export interface FileInfo {
  path: string;
  name: string;
  ext: string;
  size: number;
  modTime: string;
  favorite: boolean;
}

export interface LastImageState {
  path: string;
  timestamp: number;
  name: string;
  ext: string;
  size: number;
}

export interface UserPreferences {
  theme: string;
}

export interface AppState {
  selectedFiles: FileInfo[];
  lastImage: LastImageState | null;
  preferences: UserPreferences;
} 