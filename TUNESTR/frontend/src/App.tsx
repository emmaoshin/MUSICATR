import React, { useState } from 'react';
import { SelectFile, SelectDirectory, GetFileInfo } from '../wailsjs/go/main/App';

interface FileInfo {
  name: string;
  path: string;
  size?: number;
  modTime?: string;
  isDir?: boolean;
  ext?: string;
}

interface ErrorState {
  message: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showError = (message: string) => {
    setError({ message, timestamp: Date.now() });
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const handleFileSelect = async () => {
    setIsLoading(true);
    try {
      const filePath = await SelectFile();
      if (filePath) {
        const fileInfo = await GetFileInfo(filePath);
        setSelectedFiles((prev) => [...prev, fileInfo as FileInfo]);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      showError(`Failed to select file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectorySelect = async () => {
    setIsLoading(true);
    try {
      const dirPath = await SelectDirectory();
      if (dirPath) {
        const dirInfo = await GetFileInfo(dirPath);
        setSelectedFiles((prev) => [...prev, dirInfo as FileInfo]);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      showError(`Failed to select directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (size?: number) => {
    if (size === undefined) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = size;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">File Explorer</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.message}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleFileSelect}
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 ${
            isLoading ? 'cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Selecting...' : 'Select File'}
        </button>
        <button
          onClick={handleDirectorySelect}
          disabled={isLoading}
          className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ${
            isLoading ? 'cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Selecting...' : 'Select Folder'}
        </button>
      </div>

      <div className="border rounded p-4">
        <h2 className="text-xl mb-3">Selected Items</h2>
        {selectedFiles.length === 0 ? (
          <p className="text-gray-500">No items selected</p>
        ) : (
          selectedFiles.map((file, index) => (
            <div key={index} className="p-2 mb-2 bg-gray-100 rounded">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-600">{file.path}</p>
              {file.size !== undefined && (
                <p className="text-sm text-gray-600">Size: {formatFileSize(file.size)}</p>
              )}
              {file.modTime && (
                <p className="text-sm text-gray-600">
                  Modified: {new Date(file.modTime).toLocaleString()}
                </p>
              )}
              <p className="text-sm text-gray-600">Type: {file.isDir ? 'Directory' : 'File'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default App;
